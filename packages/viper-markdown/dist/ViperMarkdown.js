"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperMarkdown = void 0;
const viper_1 = require("@cofl/viper");
const micromark_1 = __importDefault(require("micromark"));
const mime_types_1 = require("mime-types");
const MARKDOWN_EXTENSION = /\.(md|markdown)$/i;
const MARKDOWN_MIME = mime_types_1.lookup(".md") || void function () { throw `Could not find MIME type from extension .md`; }();
const HTML_MIME = mime_types_1.lookup(".html") || void function () { throw `Could not find MIME type from extension .html`; }();
class ViperMarkdown {
    constructor(...args) {
        this.type = viper_1.ViperPluginType.Page;
        const isFirstArgumentEncoding = viper_1.isBufferEncoding(args[0]);
        this.encoding = isFirstArgumentEncoding ? args[0] : 'utf-8';
        this.options = args[isFirstArgumentEncoding ? 1 : 0] ?? {};
    }
    process(page, context) {
        if (page.contentType !== MARKDOWN_MIME)
            return;
        const encoding = context.getEncoding(page, this.encoding);
        const content = micromark_1.default(page.content, encoding ?? this.encoding, this.options);
        page.route = page.route.replace(MARKDOWN_EXTENSION, '.html');
        page.content = Buffer.from(content, encoding ?? this.encoding);
        page.contentType = HTML_MIME;
    }
}
exports.ViperMarkdown = ViperMarkdown;
//# sourceMappingURL=ViperMarkdown.js.map