/// <reference types="node" />
import type { PartialPageData } from "./Viper";
export declare enum ViperItemType {
    Page = 0,
    Directory = 1
}
export declare type ViperItem = ViperPage | ViperDirectory;
export declare class ViperPage {
    readonly type = ViperItemType.Page;
    readonly id: string;
    readonly filePath?: string;
    route: string;
    parent: ViperDirectory;
    metadata: Record<string, any>;
    contentType: string;
    content: Buffer;
    encoding?: BufferEncoding;
    constructor(id: string, parent: ViperDirectory, data: PartialPageData);
    apply(data: PartialPageData): void;
}
export declare class ViperDirectory {
    readonly type = ViperItemType.Directory;
    readonly id: string;
    readonly children: Record<string, ViperItem>;
    route: string;
    parent: ViperDirectory | null;
    constructor(id: string, parent: ViperDirectory | null, route: string);
}
export declare const isViperPage: (candidate: any) => candidate is ViperPage;
export declare const isViperDirectory: (candidate: any) => candidate is ViperDirectory;
