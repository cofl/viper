import { dirname, join, resolve } from "path";
import fs from "fs";
import { promisify } from "util";
import { routeName, routeParent, ViperOutputPlugin, ViperPageData, ViperPluginType } from "@cofl/viper";
import mkdirpPackage from "mkdirp";
import { extension } from "mime-types";

const mkdirp = mkdirpPackage;
const writeFile = promisify(fs.writeFile);
export class ViperFileExportPlugin implements ViperOutputPlugin {
    readonly type = ViperPluginType.Output;
    private readonly path: string;
    private readonly defaultName: string;
    private readonly useMimeDependentExtension: boolean;

    constructor(path: string, defaultName: string = 'index', useMimeDependentExtension: boolean = true) {
        this.path = resolve(process.cwd(), path);
        this.defaultName = defaultName;
        this.useMimeDependentExtension = useMimeDependentExtension;
    }

    private getDefaultName(contentType: string) {
        return !this.useMimeDependentExtension
            ? this.defaultName
            : `${this.defaultName}.${extension(contentType) || 'file'}`;
    }

    async write(page: ViperPageData): Promise<void> {
        const name = routeName(page.route) || this.getDefaultName(page.contentType);
        const directory = routeParent(page.route);
        const outPath = join(this.path, directory, name);
        await mkdirp(dirname(outPath));
        await writeFile(outPath, page.content, { flag: 'w' });
    }
}
