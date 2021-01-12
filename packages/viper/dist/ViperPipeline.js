"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperPipeline = void 0;
const Util_1 = require("./Util");
const Viper_1 = require("./Viper");
const ViperContext_1 = require("./ViperContext");
const ViperPlugin_1 = require("./ViperPlugin");
class ViperPipeline {
    constructor(parent) {
        this.type = ViperPlugin_1.ViperPluginType.Pipeline;
        this.plugins = [];
        this.pluginTypes = [];
        this.parent = parent;
        let instance = parent;
        while (instance && !(instance instanceof Viper_1.Viper))
            instance = instance.parent;
        if (!instance)
            throw `Could not find an ancestor Viper instance.`;
        this.instance = instance;
    }
    use(plugin) {
        this.plugins.push(plugin);
        if (this.pluginTypes.indexOf(plugin.type) < 0)
            this.pluginTypes.push(plugin.type);
        return this;
    }
    async run(context) {
        for (const plugin of this.plugins) {
            switch (plugin.type) {
                case ViperPlugin_1.ViperPluginType.Provider:
                    await plugin.load(this.instance);
                    break;
                case ViperPlugin_1.ViperPluginType.Input:
                case ViperPlugin_1.ViperPluginType.Generator:
                    for await (const item of await plugin.items())
                        this.instance.add(item);
                    break;
                case ViperPlugin_1.ViperPluginType.Page:
                    for (const item of context.instance.routeSortedPages) {
                        const pageData = ViperContext_1.getPageData(item);
                        await plugin.process(pageData, context);
                        item.apply(pageData);
                    }
                    break;
                case ViperPlugin_1.ViperPluginType.Directory:
                    for (const item of context.instance.routeSortedDirectories)
                        await plugin.process(item, context);
                    break;
                case ViperPlugin_1.ViperPluginType.Pipeline:
                    if (plugin.parent !== this)
                        throw `Illegally grafted child pipeline. Parent must be this instance.`;
                    await plugin.run(context);
                    break;
                case ViperPlugin_1.ViperPluginType.Output:
                    for (const page of context.instance.routeSortedPages.reverse())
                        await plugin.write(ViperContext_1.getPageData(page));
                    break;
                default:
                    return Util_1.assertNever(plugin, `Illegal State: Unreachable case.`);
            }
        }
    }
}
exports.ViperPipeline = ViperPipeline;
//# sourceMappingURL=ViperPipeline.js.map