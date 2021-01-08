import { ViperContext, ViperPageData, ViperPagePlugin, ViperPluginType } from "@cofl/viper";

const HTML_EXTENSION = /\.html?$/i;
export class ViperCleanURLPlugin implements ViperPagePlugin {
    readonly type = ViperPluginType.Page;

    process(page: ViperPageData, context: ViperContext): void {
        const metadata = context.getMetadata(page);
        if (false === metadata.viper?.['clean-url'])
            return;
        if (HTML_EXTENSION.test(page.route))
            page.route = page.route.replace(HTML_EXTENSION, '/');
    }
}
