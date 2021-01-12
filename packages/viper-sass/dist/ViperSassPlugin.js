"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperSassPlugin = void 0;
const viper_1 = require("@cofl/viper");
const path_1 = require("path");
const sass_1 = require("sass");
const SASS_EXTENSION = /\.scss$/i;
const CSS_EXTENSION = '.css';
class ViperSassPlugin {
    constructor(options) {
        this.type = viper_1.ViperPluginType.Page;
        this.isPure = false;
        this.removeIncludesFromOutput = options?.viperRemoveIncludesFromOutput ?? true;
        if (options && 'viperRemoveIncludesFromOutput' in options)
            delete options['viperRemoveIncludesFromOutput'];
        this.sassOptions = options;
    }
    process(page, context) {
        if (!SASS_EXTENSION.test(page.route))
            return;
        if (this.removeIncludesFromOutput && viper_1.routeName(page.route)[0] === '_') {
            context.removePage(page);
            return;
        }
        const newRoute = page.route.replace(SASS_EXTENSION, CSS_EXTENSION);
        const encoding = context.getEncoding(page, 'utf-8');
        const options = { ...this.sassOptions, outFile: newRoute, data: page.content.toString(encoding) };
        const pageMetadata = context.getMetadata(page);
        if (page.filePath || pageMetadata["sassIncludePath"]) {
            options.includePaths ?? (options.includePaths = []);
            if (page.filePath)
                options.includePaths.push(path_1.dirname(page.filePath));
            if (pageMetadata["sassIncludePath"])
                options.includePaths.push(pageMetadata["sassIncludePath"]);
        }
        const result = sass_1.renderSync(options);
        page.route = newRoute;
        page.content = result.css;
        if (result.map)
            context.addPage({
                contentType: viper_1.APPLICATION_OCTET_STREAM,
                content: result.map,
                route: `${newRoute}.map`
            });
    }
}
exports.ViperSassPlugin = ViperSassPlugin;
//# sourceMappingURL=ViperSassPlugin.js.map