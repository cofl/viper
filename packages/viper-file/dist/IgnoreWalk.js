"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ignore_1 = __importDefault(require("ignore"));
const path_1 = require("path");
const util_1 = require("util");
const viper_1 = require("@cofl/viper");
const chardet_1 = require("chardet");
const opendir = util_1.promisify(fs_1.default.opendir);
const readFile = util_1.promisify(fs_1.default.readFile);
async function* ignoreWalk(root, options) {
    if (!path_1.isAbsolute(root))
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
    const baseIgnore = ignore_1.default().add(opts.defaultIgnoreRules).add(opts.ignoreRules).add(opts.ignoreFiles);
    const stack = [{ ignore: null, path: path_1.relative(root, root), dir: await opendir(root) }];
    stackLoop: while (stack.length > 0) {
        const top = stack[stack.length - 1];
        let entry = await top.dir.read();
        if (null === entry) {
            await top.dir.close();
            stack.pop();
            continue stackLoop;
        }
        if (null === top.ignore) {
            top.ignore = ignore_1.default().add(stack[stack.length - 2]?.ignore ?? baseIgnore);
            for (const name of opts.ignoreFiles) {
                const path = path_1.join(root, top.path, name);
                const content = await readFile(path, { flag: 'r' })
                    .catch(_ => null)
                    .then(a => {
                    if (!Buffer.isBuffer(a))
                        return a;
                    const encoding = chardet_1.detect(a);
                    return a.toString(viper_1.isBufferEncoding(encoding) ? encoding : 'utf-8');
                });
                if (content)
                    top.ignore.add(content);
            }
        }
        entryLoop: for (; null !== entry; entry = await top.dir.read()) {
            const path = `${path_1.posix.join(top.path, entry.name)}${entry.isDirectory() ? '/' : ''}`;
            if (top.ignore.ignores(path))
                continue entryLoop;
            const absPath = path_1.resolve(root, path);
            if (entry.isDirectory()) {
                stack.push({ path, dir: await opendir(absPath), ignore: null });
                continue stackLoop;
            }
            else if (entry.isSymbolicLink())
                throw `Symlinks are not supported: ${absPath}`;
            else if (!entry.isFile())
                throw `Unknown entry type: ${absPath}`;
            else
                yield absPath;
        }
        // close directories once all entries have been processed.
        await top.dir.close();
        stack.pop();
    }
}
exports.default = ignoreWalk;
//# sourceMappingURL=IgnoreWalk.js.map