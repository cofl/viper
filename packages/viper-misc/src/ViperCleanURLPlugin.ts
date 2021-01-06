import { ViperContext, ViperPage, ViperPagePlugin, ViperPluginType } from "@cofl/viper";

const HTML_EXTENSION = /\.html?$/i;
export class ViperCleanURLPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;

    process(page: ViperPage, context: ViperContext): void {
        if (false === page.metadata?.viper?.['clean-url'])
            return;
        if (HTML_EXTENSION.test(page.route))
            context.rootInstance.move(page.route, page.route.replace(HTML_EXTENSION, '/'));
    }
}
