import { ViperPageData, ViperPagePlugin, ViperPluginType, ViperContext } from "@cofl/viper";
import { Options as SassOptions } from "sass";
export declare type SassPluginOptions = Omit<SassOptions, 'data' | 'file' | 'outFile' | 'sourceMap'> & {
    sourceMap?: boolean;
};
export declare class ViperSassPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    readonly isPure = false;
    private readonly sassOptions;
    private readonly removeIncludesFromOutput;
    constructor(options?: SassPluginOptions & {
        viperRemoveIncludesFromOutput?: boolean;
    });
    process(page: ViperPageData, context: ViperContext): void;
}
