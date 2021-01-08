import { assertNever } from './Util';
import { Viper } from './Viper';
import type { ViperContext, ViperPageData } from './ViperContext';
import type { ViperPage } from "./ViperItem";
import { ViperPluginType, ViperPlugin } from './ViperPlugin';

function getPageData(page: ViperPage): ViperPageData {
    return {
        id: page.id,
        route: page.route,
        content: page.content,
        contentType: page.contentType,
        contentEncoding: page.encoding,
        ownMetadata: page.metadata,
        filePath: page.filePath
    };
}

export class ViperPipeline {
    readonly type = ViperPluginType.Pipeline;
    private plugins: ViperPlugin[] = [];
    private pluginTypes: ViperPluginType[] = [];
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

    async run(context: ViperContext): Promise<void> {
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
                    for (const item of context.instance.routeSortedPages) {
                        const pageData = getPageData(item);
                        await plugin.process(pageData, context);
                        item.apply(pageData)
                    }
                    break;
                case ViperPluginType.Directory:
                    for (const item of context.instance.routeSortedDirectories)
                        await plugin.process(item, context);
                    break;
                case ViperPluginType.Pipeline:
                    if (plugin.parent !== this)
                        throw `Illegally grafted child pipeline. Parent must be this instance.`;
                    await plugin.run(context);
                    break;
                case ViperPluginType.Output:
                    for (const page of context.instance.routeSortedPages.reverse())
                        await plugin.write(getPageData(page));
                    break;
                default:
                    return assertNever(plugin, `Illegal State: Unreachable case.`);
            }
        }
    }
}
