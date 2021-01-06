declare module 'print-tree' {
    function printTree<T>(obj: T, printNode?: (obj: T) => string, getChildren?: (obj: T) => T[]): string;
    export = printTree;
}
