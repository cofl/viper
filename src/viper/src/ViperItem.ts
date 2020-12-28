import { Viper } from "./Viper";
export enum ViperItemType {
    Page,
    Directory,
    Virtual
}

export type ViperItem = ViperPage | ViperDirectory | ViperVirtualItem;
export type ViperNonDirectory = Exclude<ViperItem, ViperDirectory>;
export type ViperNonPage = Exclude<ViperItem, ViperPage>;

// common properties so I don't need to retype them all.
interface BaseViperItem {
    route: string;
    parent?: ViperNonPage;
    metadata?: Record<string, any>;
}

export interface ViperPage extends BaseViperItem {
    readonly type: ViperItemType.Page;
    metadata: Record<string, any>;
    contentType: string;
    content: Buffer;
}

export interface ViperVirtualItem extends BaseViperItem {
    readonly type: ViperItemType.Virtual;
    metadata: Record<string, any>;
    inner?: ViperItem;
}

export interface ViperDirectory extends BaseViperItem {
    readonly type: ViperItemType.Directory;
    children: Record<string, ViperItem>;
}

export const isViperPage = (candidate: any): candidate is ViperPage => candidate?.type === ViperItemType.Page;
export const isViperDirectory = (candidate: any): candidate is ViperDirectory => candidate?.type === ViperItemType.Directory;
export const isViperVirtualItem = (candidate: any): candidate is ViperVirtualItem => candidate?.type === ViperItemType.Virtual;
export const hasViperVirtualInnerItem = (candidate: any): candidate is ViperVirtualItem & { inner: ViperVirtualItem } =>
    isViperVirtualItem(candidate) && isViperVirtualItem(candidate.inner) && candidate.inner !== candidate;

export function getViperAncestorInstance(page: ViperItem) {
    let item: ViperNonPage = page.parent!;
    while (!(item instanceof Viper))
        item = item.parent!;
    return item;
}
