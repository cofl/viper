"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettyPrint = void 0;
const viper_1 = require("@cofl/viper");
const util_1 = require("util");
const print_tree_1 = __importDefault(require("print-tree"));
function nodePrinter(instance) {
    const context = instance.getContext();
    return (item) => {
        const segment = viper_1.routeName(item.route);
        const name = `${segment}${segment ? ' ' : ''}(${item.route})`;
        const type = util_1.inspect(item, false, -1, true);
        const data = context.getItemMetadata(item);
        const metadata = data ? util_1.inspect(data, false, 2, true) : '';
        if (/\[\S+\]/.test(type))
            return `${type} ${name} ${metadata}`;
        return `${name} ${metadata}`;
    };
}
function getChildren(item) {
    if (viper_1.ViperItemType.Directory !== item.type)
        return [];
    return Object.values(item.children);
}
function prettyPrint(viper) {
    const root = viper.getDirectoryByRoute(viper.route);
    return print_tree_1.default(root, nodePrinter(viper), getChildren);
}
exports.prettyPrint = prettyPrint;
//# sourceMappingURL=PrettyPrint.js.map