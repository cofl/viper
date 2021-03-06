import { ViperContext, ViperPageData } from './ViperContext';
import { ViperDirectory, ViperItem, ViperPage } from "./ViperItem";
import { ViperPipeline } from './ViperPipeline';
import type { ViperPlugin } from './ViperPlugin';
export declare const routeName: (route: string) => string;
export declare const routeParent: (route: string) => string;
export declare type MergeType = 'shallow' | 'deep' | 'none';
export declare type ViperOptions = {
    mergeType?: MergeType;
    [key: string]: any;
};
export declare type ViperContextFn = (context: ViperContext) => ViperContext | void;
declare type ViperConstructorType = [route?: string] | [options: ViperOptions] | [route: string, options: ViperOptions];
export declare type PartialPageData = Partial<ViperPageData> & Pick<ViperPageData, 'route' | 'content'>;
export declare type VirtualDataItem = {
    route: string;
    data: Record<string, any>;
    isDirectoryData?: boolean;
};
export declare type ViperAddItem = PartialPageData | VirtualDataItem;
export declare class Viper {
    #private;
    private directoryRouteMap;
    private directoryMap;
    private pageRouteMap;
    private pageMap;
    private pendingVirtualDataMap;
    private virtualDataMap;
    route: string;
    pipeline?: ViperPipeline;
    readonly contextFns: ViperContextFn[];
    private options;
    constructor(...args: ViperConstructorType);
    private getUniqueId;
    private getOrCreateDirectory;
    get routeSortedPages(): ViperPage[];
    get routeSortedDirectories(): ViperDirectory[];
    resetCaches(): Viper;
    getContext(): ViperContext;
    add(...items: ViperAddItem[]): Viper;
    getPageByID(id: string): ViperPage | undefined;
    getPageByRoute(route: string): ViperPage | undefined;
    getDirectoryById(id: string): ViperDirectory | undefined;
    getDirectoryByRoute(route: string): ViperDirectory | undefined;
    getVirtualItems(id: string): Record<string, any>[] | undefined;
    move(old: string | ViperItem, newRoute: string): Viper;
    private movePage;
    removePage(page: ViperPage | string): Viper;
    use(...plugins: ViperPlugin[]): Viper;
    inject(...fns: ViperContextFn[]): this;
    build(): Promise<Viper>;
}
export {};
