import { routeName, Viper, ViperItem, ViperItemType } from "@cofl/viper";
import { inspect } from "util";
import printTree from "print-tree";

function printNode(item: ViperItem): string {
    const segment = routeName(item.route);
    const name = `${segment}${segment ? ' ' : ''}(${item.route})`;
    const type = inspect(item, false, -1, true);
    const metadata = item.metadata ? inspect(item.metadata, false, 2, true) : '';
    if (/\[\S+\]/.test(type))
        return `${type} ${name} ${metadata}`;
    return `${name} ${metadata}`;
}

function getChildren(item: ViperItem): ViperItem[] {
    switch (item.type) {
        case ViperItemType.Directory:
            return Object.values(item.children);
        case ViperItemType.Virtual:
            if (item.inner)
                return [item.inner];
            return [];
        default:
            return [];
    }
}

export function prettyPrint(viper: Viper): string {
    return printTree<ViperItem>(viper, printNode, getChildren);
}
