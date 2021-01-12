/// <reference types="node" />
import { ViperContext, ViperPageData, ViperPagePlugin, ViperPluginType } from "@cofl/viper";
import micromark from "micromark";
export declare type MicromarkOptions = Exclude<Parameters<typeof micromark>[2], undefined>;
declare type ConstructorArguments = [] | [options: MicromarkOptions] | [encoding: BufferEncoding, options: MicromarkOptions];
export declare class ViperMarkdown implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;
    private readonly encoding;
    private readonly options;
    constructor(...args: ConstructorArguments);
    process(page: ViperPageData, context: ViperContext): void;
}
export {};
