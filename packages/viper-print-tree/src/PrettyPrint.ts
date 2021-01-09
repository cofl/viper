import { routeName, Viper, ViperItem, ViperItemType } from "@cofl/viper";
import { inspect } from "util";
import printTree from "print-tree";

function nodePrinter(instance: Viper): (item: ViperItem) => string {
    const context = instance.getContext();
    return (item: ViperItem): string => {
        const segment = routeName(item.route);
        const name = `${segment}${segment ? ' ' : ''}(${item.route})`;
        const type = inspect(item, false, -1, true);
        const data = context.getItemMetadata(item);
        const metadata = data ? inspect(data, false, 2, true) : '';
        if (/\[\S+\]/.test(type))
            return `${type} ${name} ${metadata}`;
        return `${name} ${metadata}`;
    };
}

function getChildren(item: ViperItem): ViperItem[] {
    if (ViperItemType.Directory !== item.type)
        return [];
    return Object.values(item.children);
}

export function prettyPrint(viper: Viper): string {
    const root = viper.getDirectoryByRoute(viper.route)!;
    return printTree<ViperItem>(root, nodePrinter(viper), getChildren);
}
