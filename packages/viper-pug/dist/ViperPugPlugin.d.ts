import { ViperPagePlugin, ViperPluginType, ViperContext, ViperPageData } from "@cofl/viper";
import { Options as PugOptions } from "pug";
export declare type ViperPugPageData = Omit<ViperPageData, 'content'> & {
    id: string;
    content: string;
    title?: string;
};
export declare type ViperPugPageContext = {
    pugContext: ViperPugPageContext;
    context: ViperContext;
    data: Record<string, any>;
    page: ViperPugPageData;
};
export declare class ViperPugPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    readonly isPure = true;
    private readonly templates;
    private readonly rootPath;
    private readonly pugOptions;
    constructor(rootPath: string, options?: PugOptions);
    private getTemplate;
    process(page: ViperPageData, context: ViperContext): void;
}
