import fs, { Dir, Dirent } from "fs";
import ignore, { Ignore } from "ignore";
import { isAbsolute, join, posix, relative, resolve } from "path";
import { promisify } from "util";
import { isBufferEncoding } from "@cofl/viper";
import { detect } from "chardet";

export interface Options {
    ignoreFiles?: string[];
    follow?: boolean;
    defaultIgnoreRules?: string[];
    ignoreRules?: string[];
}

interface StackItem {
    ignore: Ignore | null,
    path: string,
    dir: Dir
}
const opendir = promisify(fs.opendir);
const readFile = promisify(fs.readFile);

export default async function* ignoreWalk(root: string, options: Options): AsyncGenerator<string, void, undefined> {
    if (!isAbsolute(root))
        throw `Path must be absolute: ${root}`;
    let opts = { ...options };
    opts.defaultIgnoreRules = opts.defaultIgnoreRules || [
        '.*.swp',
        '._*',
        '.DS_Store',
        '.git*',
        'node_modules',
    ];
    opts.ignoreRules = opts.ignoreRules || [];
    opts.ignoreFiles = opts.ignoreFiles || [];

    const baseIgnore = ignore().add(opts.defaultIgnoreRules).add(opts.ignoreRules).add(opts.ignoreFiles);
    const stack: StackItem[] = [{ ignore: null, path: relative(root, root), dir: await opendir(root) }];
    stackLoop: while (stack.length > 0) {
        const top = stack[stack.length - 1]!;
        let entry: Dirent | null = await top.dir.read();
        if (null === entry) {
            await top.dir.close();
            stack.pop();
            continue stackLoop;
        }
        if (null === top.ignore) {
            top.ignore = ignore().add(stack[stack.length - 2]?.ignore ?? baseIgnore);
            for (const name of opts.ignoreFiles) {
                const path = join(root, top.path, name);
                const content = await readFile(path, { flag: 'r' })
                    .catch(_ => null)
                    .then(a => {
                        if (!Buffer.isBuffer(a))
                            return a;
                        const encoding = detect(a);
                        return a.toString(isBufferEncoding(encoding) ? encoding : 'utf-8');
                    });
                if (content)
                    top.ignore.add(content);
            }
        }
        entryLoop: for (; null !== entry; entry = await top.dir.read()) {
            const path = `${posix.join(top.path, entry.name)}${entry.isDirectory() ? '/' : ''}`;
            if (top.ignore.ignores(path))
                continue entryLoop;
            const absPath = resolve(root, path);
            if (entry.isDirectory()) {
                stack.push({ path, dir: await opendir(absPath), ignore: null });
                continue stackLoop;
            } else if (entry.isSymbolicLink())
                throw `Symlinks are not supported: ${absPath}`;
            else if (!entry.isFile())
                throw `Unknown entry type: ${absPath}`;
            else yield absPath;
        }

        // close directories once all entries have been processed.
        await top.dir.close();
        stack.pop();
    }
}
