import { isBufferEncoding, ViperGeneratorPlugin, routeName, routeParent, ViperPluginType, ViperAddItem, ViperPageData, APPLICATION_OCTET_STREAM } from "@cofl/viper";
import fs, { readFileSync } from "fs";
import { basename, extname, relative, resolve } from "path";
import { promisify } from "util";
import ignoreWalk, { Options as IgnoreOptions } from "./IgnoreWalk";
import { lookup } from "mime-types";
import { detect } from "chardet";
import frontMatter from "front-matter";

const MARKDOWN_MIME = lookup('.md') || 'text/markdown';
const MARKDOWN_FRONTMATTER_HANDLER: FileStrHandler = {
    select: MARKDOWN_MIME,
    handle(path: string): FileData {
        const content = readFileSync(path);
        const detected = detect(content);
        const encoding = isBufferEncoding(detected) ? detected : 'utf-8';
        const data = frontMatter<Record<string, any>>(content.toString(encoding));
        return {
            content: Buffer.from(data.body),
            contentType: MARKDOWN_MIME,
            metadata: data.attributes
        };
    }
};

const access = promisify(fs.access);
const exists = async (path: string) => access(path).then(_ => true).catch(_ => false);

function getPageData(filePath: string, route: string, content: Buffer, encoding?: BufferEncoding, contentType?: string, metadata?: Record<string, any>): ViperPageData {
    if (!encoding) {
        const detected = detect(content);
        if (isBufferEncoding(detected))
            encoding = detected;
    }
    return {
        route, content, filePath,
        contentEncoding: encoding,
        contentType: contentType || lookup(filePath) || APPLICATION_OCTET_STREAM,
        ownMetadata: metadata || {}
    };
}

async function isDataFile(path: string): Promise<boolean> {
    const filename = basename(path.replace(/\\/g, '/'));
    return /^_.*\.json$/i.test(filename);
}

export interface FileData {
    content?: Buffer;
    route?: string;
    contentType?: string;
    metadata?: Record<string, any>;
    isVirtual?: boolean;
}

type HandlerFn = (path: string) => (FileData | Promise<FileData>);
type SelectorFn = (path: string) => (boolean | Promise<boolean>);
type FileFnHandler = { select: SelectorFn, handle: HandlerFn };
type FileStrHandler = { select: string, handle: HandlerFn };
export type FileHandler = FileFnHandler | FileStrHandler;

function isFileFnHandler(candidate: FileHandler): candidate is FileFnHandler {
    return typeof candidate.select === 'function';
}

function getItem(path: string, route: string, data: FileData): ViperAddItem {
    if (!data.route)
        data.route = route;
    const name = routeName(data.route);
    if (data.isVirtual)
        return {
            route: `${routeParent(route)}/${name.replace(/^_|\.json$/ig, '')}`,
            data: data.metadata || {},
            isDirectoryData: name === '_.json'
        };
    if (!data.content)
        data.content = readFileSync(path);
    if (!data.contentType)
        data.contentType = lookup(path) || APPLICATION_OCTET_STREAM;
    return getPageData(path, data.route, data.content, void 0, data.contentType, data.metadata);
}

type ViperFileImportPluginConstructorType =
    | [path: string]
    | [path: string, handlers: FileHandler[]]
    | [path: string, options: IgnoreOptions, handlers?: FileHandler[]];
export class ViperFileImportPlugin implements ViperGeneratorPlugin {
    readonly type = ViperPluginType.Generator;
    readonly isPure = false;
    readonly rootPath: string;
    private readonly ignoreOptions: IgnoreOptions;
    private readonly extHandlers: Record<string, HandlerFn> = {};
    private readonly mimeHandlers: Record<string, HandlerFn> = {};
    private readonly fnHandlers: FileFnHandler[] = [];

    constructor(...args: ViperFileImportPluginConstructorType) {
        this.rootPath = resolve(process.cwd(), args[0]);
        this.ignoreOptions = args.length === 2 && !Array.isArray(args[1]) ? args[1] : {
            ignoreFiles: ['.gitignore', '.ignore']
        };
        const handlers: FileHandler[] = args.length === 3 ? args[2]! : (Array.isArray(args[1]) ? args[1] : []);
        if (handlers?.length > 0)
            this.use(...handlers);
        else
            this.useDefaults();
    }

    use(...handlers: FileHandler[]): ViperFileImportPlugin {
        for (const handler of handlers) {
            if (isFileFnHandler(handler))
                this.fnHandlers.push(handler);
            else if (handler.select[0] !== '.')
                this.mimeHandlers[handler.select] = handler.handle;
            else if (handler.select.lastIndexOf('.') === 0)
                this.extHandlers[handler.select] = handler.handle;
            else {
                const select = handler.select;
                this.fnHandlers.push({ select: (path: string) => path.endsWith(select), handle: handler.handle });
            }
        }
        return this;
    }

    useDefaults(): ViperFileImportPlugin {
        return this.use(MARKDOWN_FRONTMATTER_HANDLER);
    }

    async* items(): AsyncGenerator<ViperAddItem, void, undefined> {
        if (!await exists(this.rootPath))
            throw `Cannot access ${this.rootPath}`;
        fileLoop:
        for await (const path of ignoreWalk(this.rootPath, this.ignoreOptions)) {
            const route = relative(this.rootPath, path).replace(/\\/g, '/');
            for (const handler of this.fnHandlers) {
                if (await handler.select(path)) {
                    yield getItem(path, route, await handler.handle(path));
                    continue fileLoop;
                }
            }
            const ext = extname(path);
            if (ext?.length > 1 && ext in this.extHandlers) {
                yield getItem(path, route, await this.extHandlers[ext]!(path));
                continue fileLoop;
            }
            const mime = lookup(path);
            if (mime && mime in this.mimeHandlers) {
                yield getItem(path, route, await this.mimeHandlers[mime]!(path));
                continue fileLoop;
            }

            // fallback
            const content = readFileSync(path);
            if (await isDataFile(path)) {
                const detected = detect(content);
                const encoding = isBufferEncoding(detected) ? detected : 'utf-8';
                const name = routeName(route);
                yield {
                    route: `${routeParent(route)}/${name.replace(/^_|\.json$/ig, '')}`,
                    data: JSON.parse(content.toString(encoding)),
                    isDirectoryData: name === '_.json'
                }
            } else {
                yield getPageData(path, route, content);
            }
        }
    }
}
