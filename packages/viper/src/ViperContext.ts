import deepmerge from "deepmerge";
import { isBufferEncoding } from "./Util";
import { detect } from "chardet";
import type { Viper, ViperOptions } from "./Viper";
import type { ViperItem, ViperPage } from "./ViperItem";

export interface ViperPageData {
    route: string,
    content: Buffer,
    contentType: string,
    ownMetadata: Record<string, any>,
    filePath: string | undefined,
    __pageObject: ViperPage
};

function isViperPageData(candidate: any): candidate is ViperPageData {
    return typeof candidate?.ownMetadata === 'object';
}

export class ViperContext {
    readonly rootInstance: Viper;
    readonly options: ViperOptions;

    constructor(rootInstance: Viper, options: ViperOptions) {
        this.rootInstance = rootInstance;
        this.options = options;
    }

    reset(): void {
        this.metadataCache = {};
    }

    private metadataCache: Record<string, Record<string, any>> = {}
    getMetadata(item: ViperItem | ViperPageData): Record<string, any> {
        if (item.route in this.metadataCache)
            return this.metadataCache[item.route]!;

        if (isViperPageData(item)) {
            const page = this.rootInstance.getPage(item.route);
            if (null === page)
                throw `Could not find page from page data: ${item.route}`;
            item = page;
        }

        if (this.options.mergeType === 'none')
            return this.metadataCache[item.route] = item.metadata || {};
        const stack: ViperItem[] = [item];
        while (true) {
            const last = stack[stack.length - 1]!;
            if (!last.parent || last === last.parent)
                break;
            stack.push(last.parent);
        }
        let data = {};
        while (stack.length > 0) {
            const item = stack.pop()!;
            if (this.options.mergeType === 'shallow')
                data = { ...data, ...item.metadata };
            else if (item.metadata)
                data = deepmerge(data, item.metadata);
        }
        return this.metadataCache[item.route] = data;
    }

    getEncoding<T extends BufferEncoding | undefined>(page: ViperPageData, defaultEncoding: T): BufferEncoding | T {
        const detected = detect(page.content);
        return isBufferEncoding(detected) ? detected : defaultEncoding;
    }
}
