"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var _sortedPagesCache, _sortedDirectoriesCache;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Viper = exports.routeParent = exports.routeName = void 0;
const path_1 = require("path");
const ViperContext_1 = require("./ViperContext");
const ViperItem_1 = require("./ViperItem");
const ViperPipeline_1 = require("./ViperPipeline");
const uuid_1 = require("uuid");
var resolvePath = path_1.posix.resolve;
function normalRoute(route, instance) {
    if (!path_1.isAbsolute(route))
        route = `${instance.route}${instance.route.endsWith('/') ? '' : '/'}${route}`;
    if (route === '/')
        return route;
    return `${resolvePath(route)}${route.endsWith('/') ? '/' : ''}`;
}
const TRAILING_SLASH_REGEX = /(?<=[^\/])\/$/;
const routeName = (route) => route.endsWith('/') ? '' : path_1.basename(route);
exports.routeName = routeName;
const routeParent = (route) => route.endsWith('/')
    ? route.replace(TRAILING_SLASH_REGEX, '')
    : path_1.dirname(route);
exports.routeParent = routeParent;
function isVirtualDataItem(candidate) {
    return typeof candidate.data === 'object' && typeof candidate.content === 'undefined';
}
class Viper {
    constructor(...args) {
        this.directoryRouteMap = {};
        this.directoryMap = {};
        this.pageRouteMap = {};
        this.pageMap = {};
        this.pendingVirtualDataMap = {};
        this.virtualDataMap = {};
        this.route = '/'; // need something for normalRoute to use.
        this.contextFns = [
            identity => identity // so the reduce in build has something to work with.
        ];
        this.options = {
            mergeType: 'deep'
        };
        _sortedPagesCache.set(this, void 0);
        _sortedDirectoriesCache.set(this, void 0);
        const route = typeof args[0] === 'string' ? args[0] : '/';
        const options = typeof args[0] === 'object' ? args[0] : (args[1] instanceof Viper ? null : args[1] ?? null);
        if (options)
            this.options = { ...this.options, ...options };
        this.route = normalRoute(route, this);
        const id = this.getUniqueId();
        const root = new ViperItem_1.ViperDirectory(id, null, this.route);
        this.directoryMap[id] = root;
        this.directoryRouteMap[this.route] = id;
    }
    getUniqueId() {
        let id = uuid_1.v4();
        let tries = 0;
        for (; tries < 1000 && (id in this.pageMap || id in this.directoryMap); tries += 1)
            id = uuid_1.v4();
        if (id in this.pageMap || id in this.directoryMap)
            throw `Could not find a unique ID in ${tries} tries`;
        return id;
    }
    getOrCreateDirectory(route) {
        if (exports.routeName(route)) // if we're not at a zero-name page.
            route = exports.routeParent(route);
        route = route.replace(/(?<=.)\/$/, '');
        let directory = this.getDirectoryByRoute(route);
        if (directory)
            return directory;
        const queue = [route];
        while (true) {
            const first = queue[0];
            const parentRoute = exports.routeParent(first);
            if (parentRoute in this.directoryRouteMap) {
                const id = this.directoryRouteMap[parentRoute];
                directory = this.getDirectoryById(id);
                break;
            }
            if (parentRoute === '/')
                throw `Cannot find root.`;
            queue.unshift(parentRoute);
        }
        if (!directory)
            throw `Cannot find a directory to begin grafting.`;
        for (const route of queue) {
            const id = this.getUniqueId();
            const newDirectory = new ViperItem_1.ViperDirectory(id, directory, route);
            this.directoryRouteMap[route] = id;
            this.directoryMap[id] = newDirectory;
            directory.children[exports.routeName(route)] = newDirectory;
            directory = newDirectory;
        }
        return directory;
    }
    get routeSortedPages() {
        if (!__classPrivateFieldGet(this, _sortedPagesCache))
            __classPrivateFieldSet(this, _sortedPagesCache, Object.values(this.pageMap).sort((a, b) => a.route.localeCompare(b.route)));
        return __classPrivateFieldGet(this, _sortedPagesCache);
    }
    get routeSortedDirectories() {
        if (!__classPrivateFieldGet(this, _sortedDirectoriesCache))
            __classPrivateFieldSet(this, _sortedDirectoriesCache, Object.values(this.directoryMap).sort((a, b) => a.route.localeCompare(b.route)));
        return __classPrivateFieldGet(this, _sortedDirectoriesCache);
    }
    resetCaches() {
        __classPrivateFieldSet(this, _sortedPagesCache, void 0);
        __classPrivateFieldSet(this, _sortedDirectoriesCache, void 0);
        return this;
    }
    getContext() {
        return new ViperContext_1.ViperContext(this, this.options);
    }
    add(...items) {
        for (const item of items) {
            item.route = normalRoute(item.route, this);
            if (isVirtualDataItem(item)) {
                const { route, data, isDirectoryData } = item;
                if (isDirectoryData) {
                    const { id } = this.getOrCreateDirectory(route);
                    if (id in this.virtualDataMap)
                        this.virtualDataMap[id].push(data);
                    else
                        this.virtualDataMap[id] = [data];
                }
                else if (route in this.pageRouteMap) {
                    const id = this.pageRouteMap[route];
                    if (id in this.virtualDataMap)
                        this.virtualDataMap[id].push(data);
                    else
                        this.virtualDataMap[id] = [data];
                }
                else {
                    if (route in this.pendingVirtualDataMap)
                        this.pendingVirtualDataMap[route].push(data);
                    else
                        this.pendingVirtualDataMap[route] = [data];
                }
            }
            else {
                if (item.route in this.pageRouteMap)
                    throw `Cannot add a duplicate page at: ${item.route}`;
                const id = this.getUniqueId();
                const parent = this.getOrCreateDirectory(item.route);
                const page = new ViperItem_1.ViperPage(id, parent, item);
                this.pageMap[id] = page;
                this.pageRouteMap[page.route] = id;
                parent.children[exports.routeName(page.route)] = page;
                if (page.route in this.pendingVirtualDataMap) {
                    this.virtualDataMap[id] = this.pendingVirtualDataMap[page.route];
                    delete this.pendingVirtualDataMap[page.route];
                }
            }
        }
        return this.resetCaches();
    }
    getPageByID(id) { return this.pageMap[id]; }
    getPageByRoute(route) {
        route = normalRoute(route, this);
        if (!(route in this.pageRouteMap))
            return void 0;
        return this.pageMap[this.pageRouteMap[route]];
    }
    getDirectoryById(id) { return this.directoryMap[id]; }
    getDirectoryByRoute(route) {
        route = normalRoute(route, this);
        if (!(route in this.directoryRouteMap))
            return void 0;
        return this.directoryMap[this.directoryRouteMap[route]];
    }
    getVirtualItems(id) { return this.virtualDataMap[id]; }
    move(old, newRoute) {
        if (ViperItem_1.isViperPage(old))
            return this.movePage(old, newRoute);
        if (ViperItem_1.isViperDirectory(old))
            throw `Not implemented`;
        if (old in this.pageRouteMap) {
            const id = this.pageRouteMap[old];
            if (!(id in this.pageMap))
                throw `Cannot find page "${id}"`;
            return this.movePage(this.pageMap[id], newRoute);
        }
        if (old in this.directoryRouteMap) {
            const id = this.directoryRouteMap[old];
            if (!(id in this.directoryMap))
                throw `Cannot find directory "${id}"`;
            throw `Not implemented`;
        }
        throw `Cannot find route "${old}"`;
    }
    movePage(page, newRoute) {
        if (!(page.id in this.pageMap))
            throw `Page is not part of this instance: ${page.id}`;
        const normal = normalRoute(newRoute, this);
        if (normal === page.route)
            return this;
        if (normal in this.pageRouteMap)
            throw `Cannot move page to occupied route.`;
        delete this.pageRouteMap[page.route];
        this.pageRouteMap[normal] = page.id;
        page.route = normal;
        const newParent = this.getOrCreateDirectory(normal);
        page.parent = newParent;
        newParent.children[exports.routeName(normal)] = page;
        return this.resetCaches();
    }
    removePage(page) {
        if (typeof page === 'string') {
            if (!(page in this.pageMap))
                throw `Cannot find a page by ID: ${page}`;
            page = this.pageMap[page];
        }
        const { route, id, parent } = page;
        if (!(id in this.pageMap))
            throw `Page is not part of this instance`;
        if (!(route in this.pageRouteMap))
            throw `Page has an invalid route`;
        delete this.pageMap[id];
        delete this.pageRouteMap[route];
        delete this.virtualDataMap[id];
        delete parent.children[exports.routeName(route)];
        return this.resetCaches();
    }
    use(...plugins) {
        for (const plugin of plugins) {
            if (!this.pipeline)
                this.pipeline = new ViperPipeline_1.ViperPipeline(this);
            this.pipeline.use(plugin);
        }
        return this;
    }
    inject(...fns) {
        this.contextFns.push(...fns);
        return this;
    }
    async build() {
        if (!this.pipeline)
            return this;
        const context = this.contextFns.reduce((ctx, fn) => fn(ctx) || ctx, new ViperContext_1.ViperContext(this, this.options));
        await this.pipeline.run(context);
        return this;
    }
}
exports.Viper = Viper;
_sortedPagesCache = new WeakMap(), _sortedDirectoriesCache = new WeakMap();
//# sourceMappingURL=Viper.js.map