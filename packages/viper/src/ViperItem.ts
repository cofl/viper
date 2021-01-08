import { APPLICATION_OCTET_STREAM } from "./Util";
import type { PartialPageData } from "./Viper";

export enum ViperItemType {
    Page,
    Directory
}

export type ViperItem = ViperPage | ViperDirectory;

export class ViperPage {
    readonly type = ViperItemType.Page;
    readonly id: string;
    readonly filePath?: string;
    route: string;
    parent: ViperDirectory;
    metadata: Record<string, any>;
    contentType: string;
    content: Buffer;
    encoding?: BufferEncoding;

    constructor(id: string, parent: ViperDirectory, data: PartialPageData) {
        this.id = id;
        this.route = data.route;
        this.parent = parent;
        this.metadata = data.ownMetadata || {};
        this.contentType = data.contentType || APPLICATION_OCTET_STREAM;
        this.content = data.content;
        if (data.contentEncoding)
            this.encoding = data.contentEncoding;
        if (data.filePath)
            this.filePath = data.filePath;
    }

    apply(data: PartialPageData) {
        this.route = data.route;
        this.metadata = data.ownMetadata || this.metadata;
        this.contentType = data.contentType || this.contentType;
        this.content = data.content;
        if (data.contentEncoding)
            this.encoding = data.contentEncoding;
    }
}

export class ViperDirectory {
    readonly type = ViperItemType.Directory;
    readonly id: string;
    readonly children: Record<string, ViperItem> = {};
    route: string;
    parent: ViperDirectory | null;

    constructor(id: string, parent: ViperDirectory | null, route: string) {
        this.id = id;
        this.parent = parent;
        this.route = route;
    }
}

export const isViperPage = (candidate: any): candidate is ViperPage => candidate?.type === ViperItemType.Page;
export const isViperDirectory = (candidate: any): candidate is ViperDirectory => candidate?.type === ViperItemType.Directory;
