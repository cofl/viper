"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperPugPlugin = void 0;
const viper_1 = require("@cofl/viper");
const path_1 = require("path");
const pug_1 = require("pug");
const chardet_1 = require("chardet");
class ViperPugPlugin {
    constructor(rootPath, options) {
        this.type = viper_1.ViperPluginType.Page;
        this.isPure = true;
        this.templates = {};
        this.rootPath = path_1.resolve(process.cwd(), rootPath);
        this.pugOptions = options;
    }
    getTemplate(name) {
        if (name in this.templates)
            return this.templates[name];
        this.templates[name] = pug_1.compileFile(path_1.join(this.rootPath, name), this.pugOptions);
        return this.templates[name];
    }
    process(page, context) {
        if (!page.id)
            throw `Cannot process a page without an ID.`;
        const pageMetadata = context.getMetadata(page);
        if (!pageMetadata["template"]?.endsWith(".pug") ?? false)
            return;
        const template = this.getTemplate(pageMetadata["template"]);
        const detected = chardet_1.detect(page.content);
        const encoding = viper_1.isBufferEncoding(detected) ? detected : 'utf-8';
        const data = {
            context: context,
            data: pageMetadata,
            page: { ...page, content: page.content.toString(encoding) }
        };
        data.pugContext = data;
        if (data.data["title"])
            data.page.title = data.data["title"];
        const compiled = template(data);
        page.content = Buffer.from(compiled, encoding);
    }
}
exports.ViperPugPlugin = ViperPugPlugin;
//# sourceMappingURL=ViperPugPlugin.js.map