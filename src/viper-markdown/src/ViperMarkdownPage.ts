import { ViperItemType, ViperPage } from "@cofl/viper";
import { lookup } from "mime-types";

const HTML_MIME = lookup(".html") || void function () { throw `Could not find MIME type from extension .html`; }() as never;
export class ViperMarkdownPage implements ViperPage {
    readonly type = ViperItemType.Page;
    contentType: string = HTML_MIME;
    metadata: Record<string, any>;
    content: Buffer;
    route: string;
    original?: ViperPage;

    constructor(route: string, content: Buffer, metadata: Record<string, any>, original?: ViperPage) {
        this.route = route;
        this.content = content;
        this.metadata = metadata;
        if (original)
            this.original = original;
    }
}
