import { ViperPagePlugin, ViperPluginType, ViperContext, isBufferEncoding, ViperPageData } from "@cofl/viper";
import { join, resolve } from "path";
import { compileTemplate as CompileTemplate, compileFile, Options as PugOptions } from "pug";
import { detect } from "chardet";

export type ViperPugPageData = Omit<ViperPageData, 'content'> & {
    id: string,
    content: string,
    title?: string
}
export type ViperPugPageContext = {
    pugContext: ViperPugPageContext,
    context: ViperContext,
    data: Record<string, any>,
    page: ViperPugPageData
}
export class ViperPugPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    readonly isPure = true;
    private readonly templates: Record<string, CompileTemplate> = {};
    private readonly rootPath: string;
    private readonly pugOptions: PugOptions | undefined;

    constructor(rootPath: string, options?: PugOptions) {
        this.rootPath = resolve(process.cwd(), rootPath);
        this.pugOptions = options;
    }

    private getTemplate(name: string): CompileTemplate {
        if (name in this.templates)
            return this.templates[name]!;
        this.templates[name] = compileFile(join(this.rootPath, name), this.pugOptions);
        return this.templates[name]!;
    }

    process(page: ViperPageData, context: ViperContext): void {
        if (!page.id)
            throw `Cannot process a page without an ID.`;
        const pageMetadata = context.getMetadata(page);
        if (!pageMetadata["template"]?.endsWith(".pug") ?? false)
            return;
        const template = this.getTemplate(pageMetadata["template"]);
        const detected = detect(page.content);
        const encoding: BufferEncoding = isBufferEncoding(detected) ? detected : 'utf-8';
        const data: Omit<ViperPugPageContext, 'pugContext'> & Partial<Pick<ViperPugPageContext, 'pugContext'>> = {
            context: context,
            data: pageMetadata,
            page: { ...page as ViperPageData & { id: string }, content: page.content.toString(encoding) }
        };
        data.pugContext = data as ViperPugPageContext;
        if (data.data["title"])
            data.page.title = data.data["title"];
        const compiled = template(data);
        page.content = Buffer.from(compiled, encoding);
    }
}
