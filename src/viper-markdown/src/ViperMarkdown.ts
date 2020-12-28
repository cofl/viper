import { getViperAncestorInstance, isBufferEncoding, ViperPage, ViperPagePlugin, ViperPluginType } from "@cofl/viper";
import micromark from "micromark";
import { lookup } from "mime-types";
import { ViperMarkdownPage } from "./ViperMarkdownPage";

const MARKDOWN_EXTENSION = /\.(md|markdown)$/i;
const MARKDOWN_MIME = lookup(".md") || void function () { throw `Could not find MIME type from extension .md`; }() as never;

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

    process(page: ViperPage): void {
        if (page.contentType !== MARKDOWN_MIME)
            return;
        const encoding = isBufferEncoding(page.metadata?.viper?.encoding) ? page.metadata.viper.encoding : this.encoding;
        const content = micromark(page.content, encoding ?? this.encoding, this.options);
        const mdPage = new ViperMarkdownPage(
            page.route.replace(MARKDOWN_EXTENSION, '.html'),
            Buffer.from(content, encoding ?? this.encoding),
            page.metadata, page);
        const instance = getViperAncestorInstance(page);
        instance.replacePage(page, mdPage);
    }
}
