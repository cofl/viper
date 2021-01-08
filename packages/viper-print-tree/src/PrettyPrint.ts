import { isViperPage, routeName, Viper, ViperItem, ViperItemType } from "@cofl/viper";
import { inspect } from "util";
import printTree from "print-tree";

function printNode(item: ViperItem): string {
    const segment = routeName(item.route);
    const name = `${segment}${segment ? ' ' : ''}(${item.route})`;
    const type = inspect(item, false, -1, true);
    const metadata = isViperPage(item) ? inspect(item.metadata, false, 2, true) : '';
    if (/\[\S+\]/.test(type))
        return `${type} ${name} ${metadata}`;
    return `${name} ${metadata}`;
}

function getChildren(item: ViperItem): ViperItem[] {
    if (ViperItemType.Directory !== item.type)
        return [];
    return Object.values(item.children);
}

export function prettyPrint(viper: Viper): string {
    const root = viper.getDirectoryByRoute(viper.route)!;
    return printTree<ViperItem>(root, printNode, getChildren);
}
