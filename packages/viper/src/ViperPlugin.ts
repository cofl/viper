import type { Viper } from './Viper';
import type { ViperContext, ViperPageData } from './ViperContext';
import type { ViperNonDirectory, ViperVirtualItem, ViperDirectory } from "./ViperItem";
import type { ViperPipeline } from './ViperPipeline';

export enum ViperPluginType {
    Provider,
    Input,
    Generator,
    Page,
    Virtual,
    Directory,
    Output,
    Pipeline
}

export type ViperContentPlugin = ViperProviderPlugin | ViperInputPlugin | ViperGeneratorPlugin;
export type ViperTransformPlugin = ViperPagePlugin | ViperVirtualPlugin | ViperDirectoryPlugin;
export type ViperPlugin = ViperContentPlugin | ViperTransformPlugin | ViperOutputPlugin | ViperPipeline;

export type ViperProviderPlugin = {
    readonly type: ViperPluginType.Provider;
    readonly isPure?: boolean;
    load(instance: Viper): void | Promise<void>;
}

export function isViperProviderPlugin(candidate: any): candidate is ViperProviderPlugin {
    return candidate && candidate.type === ViperPluginType.Provider && typeof candidate.load === 'function';
}

export type ViperInputPlugin = {
    readonly type: ViperPluginType.Input;
    readonly isPure?: boolean;
    items(): Iterable<ViperNonDirectory> | Promise<Iterable<ViperNonDirectory>>;
}

export function isViperInputPlugin(candidate: any): candidate is ViperInputPlugin {
    return candidate && candidate.type === ViperPluginType.Input && typeof candidate.items === 'function';
}

export type ViperGeneratorPlugin = {
    readonly type: ViperPluginType.Generator;
    readonly isPure?: boolean;
    items(): Generator<ViperNonDirectory, void, undefined> | AsyncGenerator<ViperNonDirectory, void, undefined>;
}

export function isViperGeneratorPlugin(candidate: any): candidate is ViperGeneratorPlugin {
    return candidate && candidate.type === ViperPluginType.Generator && typeof candidate.items === 'function';
}

export type ViperPagePlugin = {
    readonly type: ViperPluginType.Page;
    readonly isPure?: boolean;
    process(page: ViperPageData, context?: ViperContext): void | Promise<void>;
}

export function isViperPagePlugin(candidate: any): candidate is ViperPagePlugin {
    return candidate && candidate.type === ViperPluginType.Page && typeof candidate.process === 'function';
}

export type ViperVirtualPlugin = {
    readonly type: ViperPluginType.Virtual;
    readonly isPure?: boolean;
    process(page: ViperVirtualItem, context?: ViperContext): void | Promise<void>;
}

export function isViperVirtualPlugin(candidate: any): candidate is ViperVirtualPlugin {
    return candidate && candidate.type === ViperPluginType.Virtual && typeof candidate.process === 'function';
}

export type ViperDirectoryPlugin = {
    readonly type: ViperPluginType.Directory;
    readonly isPure?: boolean;
    process(page: ViperDirectory, context?: ViperContext): void | Promise<void>;
}

export function isViperDirectoryPlugin(candidate: any): candidate is ViperDirectoryPlugin {
    return candidate && candidate.type === ViperPluginType.Directory && typeof candidate.process === 'function';
}

export type ViperOutputPlugin = {
    readonly type: ViperPluginType.Output;
    readonly isPure?: boolean;
    write(page: ViperPageData): void | Promise<void>;
}

export function isViperOutputPlugin(candidate: any): candidate is ViperOutputPlugin {
    return candidate && candidate.type === ViperPluginType.Output && typeof candidate.write === 'function';
}
