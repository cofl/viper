"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperFileImportPlugin = void 0;
const viper_1 = require("@cofl/viper");
const fs_1 = __importStar(require("fs"));
const path_1 = require("path");
const util_1 = require("util");
const IgnoreWalk_1 = __importDefault(require("./IgnoreWalk"));
const mime_types_1 = require("mime-types");
const chardet_1 = require("chardet");
const front_matter_1 = __importDefault(require("front-matter"));
const MARKDOWN_MIME = mime_types_1.lookup('.md') || 'text/markdown';
const MARKDOWN_FRONTMATTER_HANDLER = {
    select: MARKDOWN_MIME,
    handle(path) {
        const content = fs_1.readFileSync(path);
        const detected = chardet_1.detect(content);
        const encoding = viper_1.isBufferEncoding(detected) ? detected : 'utf-8';
        const data = front_matter_1.default(content.toString(encoding));
        return {
            content: Buffer.from(data.body),
            contentType: MARKDOWN_MIME,
            metadata: data.attributes
        };
    }
};
const access = util_1.promisify(fs_1.default.access);
const exists = async (path) => access(path).then(_ => true).catch(_ => false);
function getPageData(filePath, route, content, encoding, contentType, metadata) {
    if (!encoding) {
        const detected = chardet_1.detect(content);
        if (viper_1.isBufferEncoding(detected))
            encoding = detected;
    }
    return {
        route, content, filePath,
        contentEncoding: encoding,
        contentType: contentType || mime_types_1.lookup(filePath) || viper_1.APPLICATION_OCTET_STREAM,
        ownMetadata: metadata || {}
    };
}
async function isDataFile(path) {
    const filename = path_1.basename(path.replace(/\\/g, '/'));
    return /^_.*\.json$/i.test(filename);
}
function isFileFnHandler(candidate) {
    return typeof candidate.select === 'function';
}
function getItem(path, route, data) {
    if (!data.route)
        data.route = route;
    const name = viper_1.routeName(data.route);
    if (data.isVirtual)
        return {
            route: `${viper_1.routeParent(route)}/${name.replace(/^_|\.json$/ig, '')}`,
            data: data.metadata || {},
            isDirectoryData: name === '_.json'
        };
    if (!data.content)
        data.content = fs_1.readFileSync(path);
    if (!data.contentType)
        data.contentType = mime_types_1.lookup(path) || viper_1.APPLICATION_OCTET_STREAM;
    return getPageData(path, data.route, data.content, void 0, data.contentType, data.metadata);
}
class ViperFileImportPlugin {
    constructor(...args) {
        this.type = viper_1.ViperPluginType.Generator;
        this.isPure = false;
        this.extHandlers = {};
        this.mimeHandlers = {};
        this.fnHandlers = [];
        this.rootPath = path_1.resolve(process.cwd(), args[0]);
        this.ignoreOptions = args.length === 2 && !Array.isArray(args[1]) ? args[1] : {
            ignoreFiles: ['.gitignore', '.ignore']
        };
        const handlers = args.length === 3 ? args[2] : (Array.isArray(args[1]) ? args[1] : []);
        if (handlers?.length > 0)
            this.use(...handlers);
        else
            this.useDefaults();
    }
    use(...handlers) {
        for (const handler of handlers) {
            if (isFileFnHandler(handler))
                this.fnHandlers.push(handler);
            else if (handler.select[0] !== '.')
                this.mimeHandlers[handler.select] = handler.handle;
            else if (handler.select.lastIndexOf('.') === 0)
                this.extHandlers[handler.select] = handler.handle;
            else {
                const select = handler.select;
                this.fnHandlers.push({ select: (path) => path.endsWith(select), handle: handler.handle });
            }
        }
        return this;
    }
    useDefaults() {
        return this.use(MARKDOWN_FRONTMATTER_HANDLER);
    }
    async *items() {
        if (!await exists(this.rootPath))
            throw `Cannot access ${this.rootPath}`;
        fileLoop: for await (const path of IgnoreWalk_1.default(this.rootPath, this.ignoreOptions)) {
            const route = path_1.relative(this.rootPath, path).replace(/\\/g, '/');
            for (const handler of this.fnHandlers) {
                if (await handler.select(path)) {
                    yield getItem(path, route, await handler.handle(path));
                    continue fileLoop;
                }
            }
            const ext = path_1.extname(path);
            if (ext?.length > 1 && ext in this.extHandlers) {
                yield getItem(path, route, await this.extHandlers[ext](path));
                continue fileLoop;
            }
            const mime = mime_types_1.lookup(path);
            if (mime && mime in this.mimeHandlers) {
                yield getItem(path, route, await this.mimeHandlers[mime](path));
                continue fileLoop;
            }
            // fallback
            const content = fs_1.readFileSync(path);
            if (await isDataFile(path)) {
                const detected = chardet_1.detect(content);
                const encoding = viper_1.isBufferEncoding(detected) ? detected : 'utf-8';
                const name = viper_1.routeName(route);
                yield {
                    route: `${viper_1.routeParent(route)}/${name.replace(/^_|\.json$/ig, '')}`,
                    data: JSON.parse(content.toString(encoding)),
                    isDirectoryData: name === '_.json'
                };
            }
            else {
                yield getPageData(path, route, content);
            }
        }
    }
}
exports.ViperFileImportPlugin = ViperFileImportPlugin;
//# sourceMappingURL=ViperFileImportPlugin.js.map