"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperCleanURLPlugin = void 0;
const viper_1 = require("@cofl/viper");
const HTML_EXTENSION = /\.html?$/i;
class ViperCleanURLPlugin {
    constructor() {
        this.type = viper_1.ViperPluginType.Page;
    }
    process(page, context) {
        const metadata = context.getMetadata(page);
        if (false === metadata.viper?.['clean-url'])
            return;
        if (HTML_EXTENSION.test(page.route))
            page.route = page.route.replace(HTML_EXTENSION, '/');
    }
}
exports.ViperCleanURLPlugin = ViperCleanURLPlugin;
//# sourceMappingURL=ViperCleanURLPlugin.js.map