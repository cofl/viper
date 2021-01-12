"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isViperOutputPlugin = exports.isViperDirectoryPlugin = exports.isViperPagePlugin = exports.isViperGeneratorPlugin = exports.isViperInputPlugin = exports.isViperProviderPlugin = exports.ViperPluginType = void 0;
var ViperPluginType;
(function (ViperPluginType) {
    ViperPluginType[ViperPluginType["Provider"] = 0] = "Provider";
    ViperPluginType[ViperPluginType["Input"] = 1] = "Input";
    ViperPluginType[ViperPluginType["Generator"] = 2] = "Generator";
    ViperPluginType[ViperPluginType["Page"] = 3] = "Page";
    ViperPluginType[ViperPluginType["Directory"] = 4] = "Directory";
    ViperPluginType[ViperPluginType["Output"] = 5] = "Output";
    ViperPluginType[ViperPluginType["Pipeline"] = 6] = "Pipeline";
})(ViperPluginType = exports.ViperPluginType || (exports.ViperPluginType = {}));
function isViperProviderPlugin(candidate) {
    return candidate && candidate.type === ViperPluginType.Provider && typeof candidate.load === 'function';
}
exports.isViperProviderPlugin = isViperProviderPlugin;
function isViperInputPlugin(candidate) {
    return candidate && candidate.type === ViperPluginType.Input && typeof candidate.items === 'function';
}
exports.isViperInputPlugin = isViperInputPlugin;
function isViperGeneratorPlugin(candidate) {
    return candidate && candidate.type === ViperPluginType.Generator && typeof candidate.items === 'function';
}
exports.isViperGeneratorPlugin = isViperGeneratorPlugin;
function isViperPagePlugin(candidate) {
    return candidate && candidate.type === ViperPluginType.Page && typeof candidate.process === 'function';
}
exports.isViperPagePlugin = isViperPagePlugin;
function isViperDirectoryPlugin(candidate) {
    return candidate && candidate.type === ViperPluginType.Directory && typeof candidate.process === 'function';
}
exports.isViperDirectoryPlugin = isViperDirectoryPlugin;
function isViperOutputPlugin(candidate) {
    return candidate && candidate.type === ViperPluginType.Output && typeof candidate.write === 'function';
}
exports.isViperOutputPlugin = isViperOutputPlugin;
//# sourceMappingURL=ViperPlugin.js.map