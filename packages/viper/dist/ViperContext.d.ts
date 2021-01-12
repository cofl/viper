/// <reference types="node" />
import type { PartialPageData, Viper, ViperOptions } from "./Viper";
import { ViperDirectory, ViperItem, ViperItemType, ViperPage } from "./ViperItem";
export declare type ViperItemData = ViperPageData | ViperDirectoryData;
export interface ViperPageData {
    id: string;
    itemType: ViperItemType;
    route: string;
    content: Buffer;
    contentType: string;
    ownMetadata: Record<string, any>;
    contentEncoding?: BufferEncoding;
    readonly filePath?: string;
}
export declare class ViperDirectoryData {
    #private;
    readonly itemType = ViperItemType.Directory;
    readonly id: string;
    readonly route: string;
    readonly ownMetadata: Record<string, any>;
    get children(): ViperItemData[];
    get parent(): ViperDirectoryData | null;
    constructor(directory: ViperDirectory, context: ViperContext);
}
export declare function getPageData(page: ViperPage): ViperPageData;
export declare class ViperContext {
    readonly instance: Viper;
    readonly options: ViperOptions;
    constructor(rootInstance: Viper, options: ViperOptions);
    getMetadata(item: ViperItemData): Record<string, any>;
    getItemMetadata(item: ViperItem): Record<string, any> | undefined;
    getEncoding<T extends BufferEncoding | undefined>(page: ViperPageData, defaultEncoding: T): BufferEncoding | T;
    removePage({ id }: ViperPageData): void;
    addPage(pageData: PartialPageData): void;
    siblings(data: {
        id: string;
    }): ViperItemData[];
    parent(data: {
        id: string;
    }): ViperDirectoryData | null;
    [helperName: string]: any;
}
