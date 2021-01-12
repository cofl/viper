import { Viper } from './Viper';
import { ViperContext } from './ViperContext';
import { ViperPluginType, ViperPlugin } from './ViperPlugin';
export declare class ViperPipeline {
    readonly type = ViperPluginType.Pipeline;
    private plugins;
    private pluginTypes;
    private parent;
    private instance;
    constructor(parent: Viper | ViperPipeline);
    use(plugin: ViperPlugin): ViperPipeline;
    run(context: ViperContext): Promise<void>;
}
