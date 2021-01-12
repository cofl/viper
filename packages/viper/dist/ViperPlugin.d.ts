import type { Viper, ViperAddItem } from './Viper';
import type { ViperContext, ViperPageData } from './ViperContext';
import type { ViperDirectory } from "./ViperItem";
import type { ViperPipeline } from './ViperPipeline';
export declare enum ViperPluginType {
    Provider = 0,
    Input = 1,
    Generator = 2,
    Page = 3,
    Directory = 4,
    Output = 5,
    Pipeline = 6
}
export declare type ViperContentPlugin = ViperProviderPlugin | ViperInputPlugin | ViperGeneratorPlugin;
export declare type ViperTransformPlugin = ViperPagePlugin | ViperDirectoryPlugin;
export declare type ViperPlugin = ViperContentPlugin | ViperTransformPlugin | ViperOutputPlugin | ViperPipeline;
export declare type ViperProviderPlugin = {
    readonly type: ViperPluginType.Provider;
    load(instance: Viper): void | Promise<void>;
};
export declare function isViperProviderPlugin(candidate: any): candidate is ViperProviderPlugin;
export declare type ViperInputPlugin = {
    readonly type: ViperPluginType.Input;
    items(): Iterable<ViperAddItem> | Promise<Iterable<ViperAddItem>>;
};
export declare function isViperInputPlugin(candidate: any): candidate is ViperInputPlugin;
export declare type ViperGeneratorPlugin = {
    readonly type: ViperPluginType.Generator;
    items(): Generator<ViperAddItem, void, undefined> | AsyncGenerator<ViperAddItem, void, undefined>;
};
export declare function isViperGeneratorPlugin(candidate: any): candidate is ViperGeneratorPlugin;
export declare type ViperPagePlugin = {
    readonly type: ViperPluginType.Page;
    process(page: ViperPageData, context?: ViperContext): void | Promise<void>;
};
export declare function isViperPagePlugin(candidate: any): candidate is ViperPagePlugin;
export declare type ViperDirectoryPlugin = {
    readonly type: ViperPluginType.Directory;
    process(page: ViperDirectory, context?: ViperContext): void | Promise<void>;
};
export declare function isViperDirectoryPlugin(candidate: any): candidate is ViperDirectoryPlugin;
export declare type ViperOutputPlugin = {
    readonly type: ViperPluginType.Output;
    write(page: ViperPageData): void | Promise<void>;
};
export declare function isViperOutputPlugin(candidate: any): candidate is ViperOutputPlugin;
