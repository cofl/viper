"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperMarkdownIt = void 0;
const viper_1 = require("@cofl/viper");
const mime_types_1 = require("mime-types");
const markdown_it_1 = __importDefault(require("markdown-it"));
const MARKDOWN_EXTENSION = /\.(md|markdown)$/i;
const MARKDOWN_MIME = mime_types_1.lookup(".md") || void function () { throw `Could not find MIME type from extension .md`; }();
const HTML_MIME = mime_types_1.lookup(".html") || void function () { throw `Could not find MIME type from extension .html`; }();
class ViperMarkdownIt {
    constructor(options = {}) {
        this.type = viper_1.ViperPluginType.Page;
        this.md = new markdown_it_1.default();
        this.encoding = options.encoding || 'utf-8';
        if (options.presetName)
            this.md.configure(options.presetName);
        if (options.options)
            this.md.set(options.options);
    }
    use(plugin, ...params) {
        this.md.use(plugin, ...params);
        return this;
    }
    process(page, context) {
        if (page.contentType !== MARKDOWN_MIME)
            return;
        const encoding = context.getEncoding(page, this.encoding);
        const content = this.md.render(page.content.toString(encoding ?? this.encoding));
        page.route = page.route.replace(MARKDOWN_EXTENSION, '.html');
        page.content = Buffer.from(content, encoding ?? this.encoding);
        page.contentType = HTML_MIME;
    }
}
exports.ViperMarkdownIt = ViperMarkdownIt;
//# sourceMappingURL=ViperMarkdownIt.js.map