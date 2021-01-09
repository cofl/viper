import deepmerge from "deepmerge";
import { isBufferEncoding } from "./Util";
import { detect } from "chardet";
import type { PartialPageData, Viper, ViperOptions } from "./Viper";
import { isViperPage, ViperItem } from "./ViperItem";

export interface ViperPageData {
    id?: string,
    route: string,
    content: Buffer,
    contentType: string,
    ownMetadata: Record<string, any>,
    contentEncoding?: BufferEncoding,
    readonly filePath?: string
};

export class ViperContext {
    readonly instance: Viper;
    readonly options: ViperOptions;

    constructor(rootInstance: Viper, options: ViperOptions) {
        this.instance = rootInstance;
        this.options = options;
    }

    getMetadata(item: ViperPageData): Record<string, any> {
        if (!item.id)
            throw `Cannot find metadata for page data with no ID.`;

        const page = this.instance.getPageByID(item.id);
        if (!page)
            throw `Could not find page!`;

        if (this.options.mergeType === 'none')
            return page.metadata;

        const queue = [page.metadata];
        let current: ViperItem | null = page;
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
        const detected = detect(page.content);
        return isBufferEncoding(detected) ? detected : defaultEncoding;
    }

    removePage({ id }: ViperPageData) {
        if (!id)
            throw `Cannot remove a page with no ID.`;
        this.instance.removePage(id);
    }

    addPage(pageData: PartialPageData) {
        this.instance.add(pageData);
    }
}
