import { isBufferEncoding, ViperContext, ViperPageData, ViperPagePlugin, ViperPluginType } from "@cofl/viper";
import micromark from "micromark";
import { lookup } from "mime-types";

const MARKDOWN_EXTENSION = /\.(md|markdown)$/i;
const MARKDOWN_MIME = lookup(".md") || void function () { throw `Could not find MIME type from extension .md`; }() as never;
const HTML_MIME = lookup(".html") || void function () { throw `Could not find MIME type from extension .html`; }() as never;

export type MicromarkOptions = Exclude<Parameters<typeof micromark>[2], undefined>;
type ConstructorArguments = [] | [options: MicromarkOptions] | [encoding: BufferEncoding, options: MicromarkOptions];
export class ViperMarkdown implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    private readonly encoding: BufferEncoding;
    private readonly options: MicromarkOptions;

    constructor(...args: ConstructorArguments) {
        const isFirstArgumentEncoding = isBufferEncoding(args[0]);
        this.encoding = isFirstArgumentEncoding ? args[0] as BufferEncoding : 'utf-8';
        this.options = args[isFirstArgumentEncoding ? 1 : 0] as MicromarkOptions | undefined ?? {};
    }

    process(page: ViperPageData, context: ViperContext): void {
        if (page.contentType !== MARKDOWN_MIME)
            return;
        const encoding = context.getEncoding(page, this.encoding);
        const content = micromark(page.content, encoding ?? this.encoding, this.options);
        page.route = page.route.replace(MARKDOWN_EXTENSION, '.html');
        page.content = Buffer.from(content, encoding ?? this.encoding);
        page.contentType = HTML_MIME;
    }
}
