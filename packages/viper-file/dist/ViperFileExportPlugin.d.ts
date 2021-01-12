import { ViperOutputPlugin, ViperPageData, ViperPluginType } from "@cofl/viper";
export declare class ViperFileExportPlugin implements ViperOutputPlugin {
    readonly type = ViperPluginType.Output;
    private readonly path;
    private readonly defaultName;
    private readonly useMimeDependentExtension;
    constructor(path: string, defaultName?: string, useMimeDependentExtension?: boolean);
    private getDefaultName;
    write(page: ViperPageData): Promise<void>;
}
