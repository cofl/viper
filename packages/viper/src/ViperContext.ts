import deepmerge from "deepmerge";
import { assertNever, getEncoding } from "./Util";
import type { PartialPageData, Viper, ViperOptions } from "./Viper";
import { isViperDirectory, isViperPage, ViperDirectory, ViperItem, ViperItemType, ViperPage } from "./ViperItem";

export type ViperItemData = ViperPageData | ViperDirectoryData;
export interface ViperPageData {
    id: string,
    itemType: ViperItemType,
    route: string,
    content: Buffer,
    contentType: string,
    ownMetadata: Record<string, any>,
    contentEncoding?: BufferEncoding,
    readonly filePath?: string
};

export class ViperDirectoryData {
    readonly #object: ViperDirectory;
    readonly #context: ViperContext;
    readonly itemType = ViperItemType.Directory;
    readonly id: string;
    readonly route: string;
    readonly ownMetadata: Record<string, any>;

    get children(): ViperItemData[] {
        return Object.values(this.#object.children).map(a => isViperPage(a) ? getPageData(a) : new ViperDirectoryData(a, this.#context));
    }

    get parent(): ViperDirectoryData | null {
        return this.#object.parent ? new ViperDirectoryData(this.#object.parent, this.#context) : null;
    }

    constructor(directory: ViperDirectory, context: ViperContext) {
        this.#object = directory;
        this.#context = context;
        this.id = directory.id;
        this.route = directory.route;
        this.ownMetadata = context.getItemMetadata(directory) || {};
    }
}

export function getPageData(page: ViperPage): ViperPageData {
    return {
        id: page.id,
        itemType: page.type,
        route: page.route,
        content: page.content,
        contentType: page.contentType,
        contentEncoding: page.encoding,
        ownMetadata: page.metadata,
        filePath: page.filePath
    };
}

function getObject(context: ViperContext, data: ViperItemData): ViperItem {
    switch (data.itemType) {
        case ViperItemType.Page:
            const page = context.instance.getPageByID(data.id);
            if (!page)
                throw `Could not find page!`;
            return page;
        case ViperItemType.Directory:
            const directory = context.instance.getDirectoryById(data.id);
            if (!directory)
                throw `Could not find directory!`;
            return directory;
        default:
            return assertNever(data, `Illegal state`);
    }
}

export class ViperContext {
    readonly instance: Viper;
    readonly options: ViperOptions;

    constructor(rootInstance: Viper, options: ViperOptions) {
        this.instance = rootInstance;
        this.options = options;
    }

    getMetadata(item: ViperItemData): Record<string, any> {
        if (!item.id)
            throw `Cannot find metadata for page data with no ID.`;

        const obj = getObject(this, item);
        const data = isViperPage(obj) ? obj.metadata : {};
        if (this.options.mergeType === 'none')
            return data;

        const queue = [data];
        let current: ViperItem | null = obj;
        do {
            const items = this.instance.getVirtualItems(current.id);
            if (items)
                queue.unshift(...items);
            current = current.parent;
        } while (current);

        if (this.options.mergeType === 'shallow')
            return Object.assign({}, ...queue);
        return queue.reduce((a, b) => deepmerge(a, b), {});
    }

    getItemMetadata(item: ViperItem): Record<string, any> | undefined {
        const base = isViperPage(item) ? item.metadata : void 0;
        if (this.options.mergeType === 'none')
            return base;
        const virtual = this.instance.getVirtualItems(item.id);
        if (!base && (!virtual || virtual.length === 0))
            return void 0;
        if (this.options.mergeType === 'shallow')
            return Object.assign(base || {}, ...(virtual || []).reverse());
        return virtual?.reverse().reduce((a, b) => deepmerge(a, b), base || {}) || base;
    }

    getEncoding<T extends BufferEncoding | undefined>(page: ViperPageData, defaultEncoding: T): BufferEncoding | T {
        if (page.contentEncoding)
            return page.contentEncoding;
        return getEncoding(page.content, defaultEncoding);
    }

    removePage({ id }: ViperPageData) {
        if (!id)
            throw `Cannot remove a page with no ID.`;
        this.instance.removePage(id);
    }

    addPage(pageData: PartialPageData) {
        this.instance.add(pageData);
    }

    siblings(data: { id: string }) {
        if (!data.id)
            throw `Cannot find a page with no ID.`;
        const item = isViperPage(data) ? data : isViperDirectory(data) ? data : this.instance.getPageByID(data.id) || this.instance.getDirectoryById(data.id);
        if (!item)
            throw `Cannot find item.`;
        if (!item.parent)
            return [];
        return Object.values(item.parent.children).filter(({ id }) => id !== item.id).map(a => a.type === ViperItemType.Page ? getPageData(a) : new ViperDirectoryData(a, this))
    }

    parent(data: { id: string }): ViperDirectoryData | null {
        if (!data.id)
            throw `Cannot find a page with no ID.`;
        const item = isViperPage(data) ? data : isViperDirectory(data) ? data : this.instance.getPageByID(data.id) || this.instance.getDirectoryById(data.id);
        if (!item)
            throw `Cannot find item.`;
        if (!item.parent)
            return null;
        return new ViperDirectoryData(item.parent, this);
    }

    [helperName: string]: any;
}
