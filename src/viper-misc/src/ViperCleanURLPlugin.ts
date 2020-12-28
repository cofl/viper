import { getViperAncestorInstance, ViperPage, ViperPagePlugin, ViperPluginType } from "@cofl/viper";

const HTML_EXTENSION = /\.html?$/i;
export class ViperCleanURLPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;

    process(page: ViperPage): void {
        if (false === page.metadata?.viper?.['clean-url'])
            return;
        if (HTML_EXTENSION.test(page.route)) {
            const instance = getViperAncestorInstance(page);
            instance.move(page.route, page.route.replace(HTML_EXTENSION, '/'));
        }
    }
}
