"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _object, _context;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViperContext = exports.getPageData = exports.ViperDirectoryData = void 0;
const deepmerge_1 = __importDefault(require("deepmerge"));
const Util_1 = require("./Util");
const ViperItem_1 = require("./ViperItem");
;
class ViperDirectoryData {
    constructor(directory, context) {
        _object.set(this, void 0);
        _context.set(this, void 0);
        this.itemType = ViperItem_1.ViperItemType.Directory;
        __classPrivateFieldSet(this, _object, directory);
        __classPrivateFieldSet(this, _context, context);
        this.id = directory.id;
        this.route = directory.route;
        this.ownMetadata = context.getItemMetadata(directory) || {};
    }
    get children() {
        return Object.values(__classPrivateFieldGet(this, _object).children).map(a => ViperItem_1.isViperPage(a) ? getPageData(a) : new ViperDirectoryData(a, __classPrivateFieldGet(this, _context)));
    }
    get parent() {
        return __classPrivateFieldGet(this, _object).parent ? new ViperDirectoryData(__classPrivateFieldGet(this, _object).parent, __classPrivateFieldGet(this, _context)) : null;
    }
}
exports.ViperDirectoryData = ViperDirectoryData;
_object = new WeakMap(), _context = new WeakMap();
function getPageData(page) {
    return {
        id: page.id,
        itemType: page.type,
        route: page.route,
        content: page.content,
        contentType: page.contentType,
        contentEncoding: page.encoding,
        ownMetadata: page.metadata,
        filePath: page.filePath
    };
}
exports.getPageData = getPageData;
function getObject(context, data) {
    switch (data.itemType) {
        case ViperItem_1.ViperItemType.Page:
            const page = context.instance.getPageByID(data.id);
            if (!page)
                throw `Could not find page!`;
            return page;
        case ViperItem_1.ViperItemType.Directory:
            const directory = context.instance.getDirectoryById(data.id);
            if (!directory)
                throw `Could not find directory!`;
            return directory;
        default:
            return Util_1.assertNever(data, `Illegal state`);
    }
}
class ViperContext {
    constructor(rootInstance, options) {
        this.instance = rootInstance;
        this.options = options;
    }
    getMetadata(item) {
        if (!item.id)
            throw `Cannot find metadata for page data with no ID.`;
        const obj = getObject(this, item);
        const data = ViperItem_1.isViperPage(obj) ? obj.metadata : {};
        if (this.options.mergeType === 'none')
            return data;
        const queue = [data];
        let current = obj;
        do {
            const items = this.instance.getVirtualItems(current.id);
            if (items)
                queue.unshift(...items);
            current = current.parent;
        } while (current);
        if (this.options.mergeType === 'shallow')
            return Object.assign({}, ...queue);
        return queue.reduce((a, b) => deepmerge_1.default(a, b), {});
    }
    getItemMetadata(item) {
        const base = ViperItem_1.isViperPage(item) ? item.metadata : void 0;
        if (this.options.mergeType === 'none')
            return base;
        const virtual = this.instance.getVirtualItems(item.id);
        if (!base && (!virtual || virtual.length === 0))
            return void 0;
        if (this.options.mergeType === 'shallow')
            return Object.assign(base || {}, ...(virtual || []).reverse());
        return virtual?.reverse().reduce((a, b) => deepmerge_1.default(a, b), base || {}) || base;
    }
    getEncoding(page, defaultEncoding) {
        if (page.contentEncoding)
            return page.contentEncoding;
        return Util_1.getEncoding(page.content, defaultEncoding);
    }
    removePage({ id }) {
        if (!id)
            throw `Cannot remove a page with no ID.`;
        this.instance.removePage(id);
    }
    addPage(pageData) {
        this.instance.add(pageData);
    }
    siblings(data) {
        if (!data.id)
            throw `Cannot find a page with no ID.`;
        const item = ViperItem_1.isViperPage(data) ? data : ViperItem_1.isViperDirectory(data) ? data : this.instance.getPageByID(data.id) || this.instance.getDirectoryById(data.id);
        if (!item)
            throw `Cannot find item.`;
        if (!item.parent)
            return [];
        return Object.values(item.parent.children).filter(({ id }) => id !== item.id).map(a => a.type === ViperItem_1.ViperItemType.Page ? getPageData(a) : new ViperDirectoryData(a, this));
    }
    parent(data) {
        if (!data.id)
            throw `Cannot find a page with no ID.`;
        const item = ViperItem_1.isViperPage(data) ? data : ViperItem_1.isViperDirectory(data) ? data : this.instance.getPageByID(data.id) || this.instance.getDirectoryById(data.id);
        if (!item)
            throw `Cannot find item.`;
        if (!item.parent)
            return null;
        return new ViperDirectoryData(item.parent, this);
    }
}
exports.ViperContext = ViperContext;
//# sourceMappingURL=ViperContext.js.map