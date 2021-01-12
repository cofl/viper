"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isViperDirectory = exports.isViperPage = exports.ViperDirectory = exports.ViperPage = exports.ViperItemType = void 0;
const Util_1 = require("./Util");
var ViperItemType;
(function (ViperItemType) {
    ViperItemType[ViperItemType["Page"] = 0] = "Page";
    ViperItemType[ViperItemType["Directory"] = 1] = "Directory";
})(ViperItemType = exports.ViperItemType || (exports.ViperItemType = {}));
class ViperPage {
    constructor(id, parent, data) {
        this.type = ViperItemType.Page;
        this.id = id;
        this.route = data.route;
        this.parent = parent;
        this.metadata = data.ownMetadata || {};
        this.contentType = data.contentType || Util_1.APPLICATION_OCTET_STREAM;
        this.content = data.content;
        if (data.contentEncoding)
            this.encoding = data.contentEncoding;
        if (data.filePath)
            this.filePath = data.filePath;
    }
    apply(data) {
        this.route = data.route;
        this.metadata = data.ownMetadata || this.metadata;
        this.contentType = data.contentType || this.contentType;
        this.content = data.content;
        if (data.contentEncoding)
            this.encoding = data.contentEncoding;
    }
}
exports.ViperPage = ViperPage;
class ViperDirectory {
    constructor(id, parent, route) {
        this.type = ViperItemType.Directory;
        this.children = {};
        this.id = id;
        this.parent = parent;
        this.route = route;
    }
}
exports.ViperDirectory = ViperDirectory;
const isViperPage = (candidate) => candidate?.type === ViperItemType.Page;
exports.isViperPage = isViperPage;
const isViperDirectory = (candidate) => candidate?.type === ViperItemType.Directory;
exports.isViperDirectory = isViperDirectory;
//# sourceMappingURL=ViperItem.js.map