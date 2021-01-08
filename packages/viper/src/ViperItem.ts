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

export class ViperPage implements BaseViperItem {
    readonly type = ViperItemType.Page;
    readonly filePath?: string;
    metadata: Record<string, any>;
    route: string;
    contentType: string;
    content: Buffer;
    encoding?: BufferEncoding;

    parent?: ViperDirectory | ViperVirtualItem | undefined;
    inner?: ViperItem;

    constructor(route: string, contentType: string, content: Buffer, metadata: Record<string, any> = {}, data?: {
        filePath?: string,
        encoding?: BufferEncoding
    }) {
        this.route = route;
        this.metadata = metadata;
        this.contentType = contentType;
        this.content = content;
        if (data) {
            if (data.filePath)
                this.filePath = data.filePath;
            if (data.encoding)
                this.encoding = data.encoding;
        }
    }
}

export class ViperVirtualItem implements BaseViperItem {
    readonly type = ViperItemType.Virtual;
    readonly metadata: Record<string, any>;
    readonly filePath?: string;
    route: string;
    parent?: ViperDirectory | ViperVirtualItem | undefined;
    inner?: ViperItem;

    constructor(route: string, metadata: Record<string, any> = {}, path?: string) {
        this.route = route;
        this.metadata = metadata;
        if (typeof path === 'string')
            this.filePath = path;
    }
}

export class ViperDirectory implements BaseViperItem {
    readonly type = ViperItemType.Directory;
    readonly children: Record<string, ViperItem> = {};
    route: string;
    parent?: ViperDirectory | ViperVirtualItem | undefined;
    metadata?: Record<string, any> | undefined;

    constructor(route: string) {
        this.route = route;
    }
}

export const isViperPage = (candidate: any): candidate is ViperPage => candidate?.type === ViperItemType.Page;
export const isViperDirectory = (candidate: any): candidate is ViperDirectory => candidate?.type === ViperItemType.Directory;
export const isViperVirtualItem = (candidate: any): candidate is ViperVirtualItem => candidate?.type === ViperItemType.Virtual;
export const hasViperVirtualInnerItem = (candidate: any): candidate is ViperVirtualItem & { inner: ViperVirtualItem } =>
    isViperVirtualItem(candidate) && isViperVirtualItem(candidate.inner) && candidate.inner !== candidate;
