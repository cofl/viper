export interface Options {
    ignoreFiles?: string[];
    follow?: boolean;
    defaultIgnoreRules?: string[];
    ignoreRules?: string[];
}
export default function ignoreWalk(root: string, options: Options): AsyncGenerator<string, void, undefined>;
