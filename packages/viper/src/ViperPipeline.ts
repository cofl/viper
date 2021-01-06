import { isNonEmptyArray, NonEmptyArray } from './NonEmptyArray';
import { assertNever } from './Util';
import { Viper } from './Viper';
import type { ViperContext } from './ViperContext';
import type { ViperPage, ViperVirtualItem, ViperDirectory } from "./ViperItem";
import { ViperPluginType, ViperPlugin } from './ViperPlugin';

type Maps = {
    pageRouteMap: Record<string, ViperPage>,
    directoryRouteMap: Record<string, ViperDirectory>,
    virtualRouteMap: Record<string, NonEmptyArray<ViperVirtualItem>>,
};

type Sorted = {
    pages?: ViperPage[],
    virtuals?: ViperVirtualItem[],
    directories?: ViperDirectory[],
};

export class ViperPipeline {
    readonly type = ViperPluginType.Pipeline;
    get isPure(): boolean { return !this.plugins.some(a => !a.isPure); }
    private plugins: ViperPlugin[] = [];
    private pluginTypes: ViperPluginType[] = [];
    private get needsSortedPages(): boolean {
        return this.pluginTypes.some(a => a === ViperPluginType.Page || a === ViperPluginType.Directory);
    }
    private get needsSortedVirtuals(): boolean { return this.pluginTypes.indexOf(ViperPluginType.Virtual) >= 0; }
    private get needsSortedDirectories(): boolean { return this.pluginTypes.indexOf(ViperPluginType.Directory) >= 0; }
    private parent: (Viper | ViperPipeline);
    private instance: Viper;

    constructor(parent: Viper | ViperPipeline) {
        this.parent = parent;
        let instance = parent;
        while (instance && !(instance instanceof Viper))
            instance = instance.parent;
        if (!instance)
            throw `Could not find an ancestor Viper instance.`;
        this.instance = instance;
    }

    use(plugin: ViperPlugin): ViperPipeline {
        this.plugins.push(plugin);
        if (this.pluginTypes.indexOf(plugin.type) < 0)
            this.pluginTypes.push(plugin.type);
        return this;
    }

    private getSorted(maps: Maps, sorted?: Sorted): Sorted {
        return {
            pages: sorted?.pages ?? (!this.needsSortedPages ? void 0 : Object.values(maps.pageRouteMap)
                .filter(a => a.route.startsWith(this.instance.route))
                .sort((a, b) => a.route.localeCompare(b.route))),
            virtuals: sorted?.virtuals ?? (!this.needsSortedVirtuals ? void 0 : Object.keys(maps.virtualRouteMap)
                .filter(a => a.startsWith(this.instance.route))
                .sort((a, b) => a.localeCompare(b))
                .flatMap(a => maps.virtualRouteMap[a]!)),
            directories: sorted?.directories ?? (!this.needsSortedDirectories ? void 0 : Object.values(maps.directoryRouteMap)
                .filter(a => a.route.startsWith(this.instance.route))
                .sort((a, b) => a.route.localeCompare(b.route)))
        };
    }

    async run(context: ViperContext, maps: Maps, preSorted?: Sorted): Promise<void> {
        if (!isNonEmptyArray(this.plugins))
            return;
        let sorted = this.getSorted(maps, preSorted);
        for (const plugin of this.plugins) {
            switch (plugin.type) {
                case ViperPluginType.Provider:
                    await plugin.load(this.instance);
                    break;
                case ViperPluginType.Input:
                case ViperPluginType.Generator:
                    for await (const item of await plugin.items())
                        this.instance.add(item);
                    break;
                case ViperPluginType.Page:
                    for (const item of sorted.pages!)
                        await plugin.process({
                            route: item.route,
                            content: item.content,
                            contentType: item.contentType,
                            ownMetadata: item.metadata,
                            filePath: item.filePath,
                            __pageObject: item
                        }, context);
                    break;
                case ViperPluginType.Virtual:
                    for (const item of sorted.virtuals!)
                        await plugin.process(item, context);
                    break;
                case ViperPluginType.Directory:
                    for (const item of sorted.directories!)
                        await plugin.process(item, context);
                    break;
                case ViperPluginType.Pipeline:
                    if (plugin.parent !== this)
                        throw `Illegally grafted child pipeline. Parent must be this instance.`;
                    await plugin.run(context, maps, sorted);
                    break;
                case ViperPluginType.Output:
                    if (sorted?.pages)
                        for (let i = sorted.pages.length - 1; i >= 0; i -= 1)
                            await plugin.write(sorted.pages[i]!);
                    break;
                default:
                    return assertNever(plugin, `Illegal State: Unreachable case.`);
            }
            if (!plugin.isPure) {
                context.reset();
                sorted = this.getSorted(maps);
            }
        }
    }
}
