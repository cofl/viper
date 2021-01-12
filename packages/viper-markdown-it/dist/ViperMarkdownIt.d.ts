/// <reference types="node" />
import { ViperContext, ViperPageData, ViperPagePlugin, ViperPluginType } from "@cofl/viper";
import { Options as MarkdownItOptions, PluginSimple, PluginWithOptions, PluginWithParams, PresetName } from "markdown-it";
export declare type Options = {
    encoding?: BufferEncoding;
    presetName?: PresetName;
    options?: MarkdownItOptions;
};
export declare class ViperMarkdownIt implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    private readonly encoding;
    private readonly md;
    constructor(options?: Options);
    use(plugin: PluginSimple): this;
    use<T>(plugin: PluginWithOptions<T>, options?: T): this;
    use(plugin: PluginWithParams, ...params: any[]): this;
    process(page: ViperPageData, context: ViperContext): void;
}
