import deepmerge from "deepmerge";
import type { Viper, ViperOptions } from "./Viper";
import type { ViperItem } from "./ViperItem";

export class ViperContext {
    readonly rootInstance: Viper;
    readonly options: ViperOptions;

    constructor(rootInstance: Viper, options: ViperOptions) {
        this.rootInstance = rootInstance;
        this.options = options;
    }

    getMetadata(item: ViperItem): Record<string, any> {
        // TODO: memoize
        if (this.options.mergeType === 'none')
            return item.metadata || {};
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
        return data;
    }
}
