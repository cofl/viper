import { ViperContext, ViperPageData, ViperPagePlugin, ViperPluginType } from "@cofl/viper";
export declare class ViperCleanURLPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    process(page: ViperPageData, context: ViperContext): void;
}
