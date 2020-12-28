import { Viper } from '@cofl/viper';
import { ViperFileImportPlugin, ViperFileExportPlugin } from '@cofl/viper-file';
import { ViperMarkdown } from '@cofl/viper-markdown';
import { ViperCleanURLPlugin } from '@cofl/viper-misc';
import { dirname, resolve } from 'path';
import { prettyPrint } from '@cofl/viper-print-tree';
import { ViperPugPlugin } from '@cofl/viper-pug';

void async function () {
    const base = dirname(__dirname);
    let viper = await new Viper()
        .use(new ViperFileImportPlugin(resolve(base, 'data')))
        .use(new ViperMarkdown())
        .use(new ViperCleanURLPlugin())
        .use(new ViperPugPlugin(resolve(base, 'templates')))
        .use(new ViperFileExportPlugin(resolve(base, 'out')))
        .build();
    console.log(prettyPrint(viper));
}();
