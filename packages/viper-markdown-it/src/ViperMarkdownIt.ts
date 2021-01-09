import { ViperContext, ViperPageData, ViperPagePlugin, ViperPluginType } from "@cofl/viper";
import { lookup } from "mime-types";
import MarkdownIt, { Options as MarkdownItOptions, PluginSimple, PluginWithOptions, PluginWithParams, PresetName } from "markdown-it";

const MARKDOWN_EXTENSION = /\.(md|markdown)$/i;
const MARKDOWN_MIME = lookup(".md") || void function () { throw `Could not find MIME type from extension .md`; }() as never;
const HTML_MIME = lookup(".html") || void function () { throw `Could not find MIME type from extension .html`; }() as never;

export type Options = {
    encoding?: BufferEncoding,
    presetName?: PresetName,
    options?: MarkdownItOptions
}
export class ViperMarkdownIt implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    private readonly encoding: BufferEncoding;
    private readonly md = new MarkdownIt();

    constructor(options: Options = {}) {
        this.encoding = options.encoding || 'utf-8';
        if (options.presetName)
            this.md.configure(options.presetName);
        if (options.options)
            this.md.set(options.options);
    }

    use(plugin: PluginSimple): this;
    use<T>(plugin: PluginWithOptions<T>, options?: T): this;
    use(plugin: PluginWithParams, ...params: any[]): this;
    use<T>(plugin: PluginSimple | PluginWithOptions<T> | PluginWithParams, ...params: any[]) {
        this.md.use(plugin, ...params);
        return this;
    }

    process(page: ViperPageData, context: ViperContext): void {
        if (page.contentType !== MARKDOWN_MIME)
            return;
        const encoding = context.getEncoding(page, this.encoding);
        const content = this.md.render(page.content.toString(encoding ?? this.encoding));
        page.route = page.route.replace(MARKDOWN_EXTENSION, '.html');
        page.content = Buffer.from(content, encoding ?? this.encoding);
        page.contentType = HTML_MIME;
    }
}
