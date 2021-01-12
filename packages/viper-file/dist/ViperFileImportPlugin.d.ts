/// <reference types="node" />
import { ViperGeneratorPlugin, ViperPluginType, ViperAddItem } from "@cofl/viper";
import { Options as IgnoreOptions } from "./IgnoreWalk";
export interface FileData {
    content?: Buffer;
    route?: string;
    contentType?: string;
    metadata?: Record<string, any>;
    isVirtual?: boolean;
}
declare type HandlerFn = (path: string) => (FileData | Promise<FileData>);
declare type SelectorFn = (path: string) => (boolean | Promise<boolean>);
declare type FileFnHandler = {
    select: SelectorFn;
    handle: HandlerFn;
};
declare type FileStrHandler = {
    select: string;
    handle: HandlerFn;
};
export declare type FileHandler = FileFnHandler | FileStrHandler;
declare type ViperFileImportPluginConstructorType = [path: string] | [path: string, handlers: FileHandler[]] | [path: string, options: IgnoreOptions, handlers?: FileHandler[]];
export declare class ViperFileImportPlugin implements ViperGeneratorPlugin {
    readonly type = ViperPluginType.Generator;
    readonly isPure = false;
    readonly rootPath: string;
    private readonly ignoreOptions;
    private readonly extHandlers;
    private readonly mimeHandlers;
    private readonly fnHandlers;
    constructor(...args: ViperFileImportPluginConstructorType);
    use(...handlers: FileHandler[]): ViperFileImportPlugin;
    useDefaults(): ViperFileImportPlugin;
    items(): AsyncGenerator<ViperAddItem, void, undefined>;
}
export {};
