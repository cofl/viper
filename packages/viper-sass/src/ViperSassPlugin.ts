import { ViperPage, ViperPageData, ViperPagePlugin, ViperPluginType, ViperContext, ViperItemType, routeName } from "@cofl/viper";
import { dirname } from "path";
import { renderSync, Options as SassOptions } from "sass";

class ViperSassSourceMap implements ViperPage {
    readonly type = ViperItemType.Page;
    readonly metadata: Record<string, any> = {};
    readonly contentType: string = 'application/octet-stream';
    route: string;
    content: Buffer;

    constructor(route: string, content: Buffer) {
        this.route = route;
        this.content = content;
    }
}

const SASS_EXTENSION = /\.scss$/i;
const CSS_EXTENSION = '.css';
export type SassPluginOptions = Omit<SassOptions, 'data' | 'file' | 'outFile' | 'sourceMap'> & { sourceMap?: boolean };
export class ViperSassPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    readonly isPure = false;
    private readonly sassOptions: SassPluginOptions | undefined;
    private readonly removeIncludesFromOutput: boolean;

    constructor(options?: SassPluginOptions & { viperRemoveIncludesFromOutput?: boolean }) {
        this.removeIncludesFromOutput = options?.viperRemoveIncludesFromOutput ?? true;
        if (options && 'viperRemoveIncludesFromOutput' in options)
            delete options['viperRemoveIncludesFromOutput'];
        this.sassOptions = options;
    }

    process(page: ViperPageData, context: ViperContext): void {
        if (!SASS_EXTENSION.test(page.route))
            return;
        if (this.removeIncludesFromOutput && routeName(page.route)[0] === '_') {
            context.rootInstance.removePage(page.__pageObject);
            return;
        }

        const newRoute = page.route.replace(SASS_EXTENSION, CSS_EXTENSION);
        const encoding = context.getEncoding(page, 'utf-8');
        const options = { ...this.sassOptions, outFile: newRoute, data: page.content.toString(encoding) };
        const pageMetadata = context.getMetadata(page);
        if (page.filePath || pageMetadata["sassIncludePath"]) {
            options.includePaths ??= [];
            if (page.filePath)
                options.includePaths.push(dirname(page.filePath));
            if (pageMetadata["sassIncludePath"])
                options.includePaths.push(pageMetadata["sassIncludePath"]);
        }
        const result = renderSync(options);
        page.content = result.css;

        context.rootInstance.movePage(page.__pageObject, newRoute);
        if (result.map)
            context.rootInstance.addPage(new ViperSassSourceMap(`${newRoute}.map`, result.map))
    }
}
