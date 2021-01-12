"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperFileExportPlugin = void 0;
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const viper_1 = require("@cofl/viper");
const mkdirp_1 = __importDefault(require("mkdirp"));
const mime_types_1 = require("mime-types");
const mkdirp = mkdirp_1.default;
const writeFile = util_1.promisify(fs_1.default.writeFile);
class ViperFileExportPlugin {
    constructor(path, defaultName = 'index', useMimeDependentExtension = true) {
        this.type = viper_1.ViperPluginType.Output;
        this.path = path_1.resolve(process.cwd(), path);
        this.defaultName = defaultName;
        this.useMimeDependentExtension = useMimeDependentExtension;
    }
    getDefaultName(contentType) {
        return !this.useMimeDependentExtension
            ? this.defaultName
            : `${this.defaultName}.${mime_types_1.extension(contentType) || 'file'}`;
    }
    async write(page) {
        const name = viper_1.routeName(page.route) || this.getDefaultName(page.contentType);
        const directory = viper_1.routeParent(page.route);
        const outPath = path_1.join(this.path, directory, name);
        await mkdirp(path_1.dirname(outPath));
        await writeFile(outPath, page.content, { flag: 'w' });
    }
}
exports.ViperFileExportPlugin = ViperFileExportPlugin;
//# sourceMappingURL=ViperFileExportPlugin.js.map