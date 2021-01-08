import { isAbsolute, basename, dirname, posix } from 'path';
import { ViperContext, ViperPageData } from './ViperContext';
import { isViperDirectory, isViperPage, ViperDirectory, ViperItem, ViperPage } from "./ViperItem";
import { ViperPipeline } from './ViperPipeline';
import type { ViperPlugin } from './ViperPlugin';
import { v4 as uuidv4 } from 'uuid';
import resolvePath = posix.resolve;

function normalRoute(route: string, instance: Viper | ViperDirectory) {
    if (!isAbsolute(route))
        route = `${instance.route}${instance.route.endsWith('/') ? '' : '/'}${route}`;
    if (route === '/')
        return route;
    return `${resolvePath(route)}${route.endsWith('/') ? '/' : ''}`;
}

const TRAILING_SLASH_REGEX = /(?<=[^\/])\/$/;
export const routeName = (route: string): string => route.endsWith('/') ? '' : basename(route);
export const routeParent = (route: string): string => route.endsWith('/')
    ? route.replace(TRAILING_SLASH_REGEX, '')
    : dirname(route);

export type MergeType = 'shallow' | 'deep' | 'none';
export type ViperOptions = {
    mergeType: MergeType
};

type ViperConstructorType =
    | [route?: string]
    | [options: ViperOptions]
    | [route: string, options: ViperOptions];
export type PartialPageData = Partial<ViperPageData> & Pick<ViperPageData, 'route' | 'content'>
export type VirtualDataItem = { route: string, data: Record<string, any>, isDirectoryData?: boolean };
export type ViperAddItem = PartialPageData | VirtualDataItem;
function isVirtualDataItem(candidate: PartialPageData | VirtualDataItem): candidate is VirtualDataItem {
    return typeof (candidate as any).data === 'object' && typeof (candidate as any).content === 'undefined';
}
export class Viper {
    private directoryRouteMap: Record<string, string> = {};
    private directoryMap: Record<string, ViperDirectory> = {}

    private pageRouteMap: Record<string, string> = {};
    private pageMap: Record<string, ViperPage> = {};

    private pendingVirtualDataMap: Record<string, Record<string, any>[]> = {};
    private virtualDataMap: Record<string, Record<string, any>[]> = {};

    route: string = '/'; // need something for normalRoute to use.
    pipeline?: ViperPipeline;
    private options: ViperOptions = {
        mergeType: 'deep'
    };

    constructor(...args: ViperConstructorType) {
        const route = typeof args[0] === 'string' ? args[0] : '/';
        const options: ViperOptions | null = typeof args[0] === 'object' ? args[0] : (args[1] instanceof Viper ? null : args[1] ?? null);
        if (options)
            this.options = { ...this.options, ...options };
        this.route = normalRoute(route, this);

        const id = this.getUniqueId();
        const root = new ViperDirectory(id, null, this.route);
        this.directoryMap[id] = root;
        this.directoryRouteMap[this.route] = id;
    }

    private getUniqueId(): string {
        let id = uuidv4();
        let tries = 0;
        for (; tries < 1000 && (id in this.pageMap || id in this.directoryMap); tries += 1)
            id = uuidv4();
        if (id in this.pageMap || id in this.directoryMap)
            throw `Could not find a unique ID in ${tries} tries`;
        return id;
    }

    private getOrCreateDirectory(route: string): ViperDirectory {
        if (routeName(route)) // if we're not at a zero-name page.
            route = routeParent(route);
        let directory = this.getDirectoryByRoute(route);
        if (directory)
            return directory;
        const queue = [route];
        while (true) {
            const first = queue[0]!;
            const parentRoute = routeParent(first);
            if (parentRoute in this.directoryRouteMap) {
                const id = this.directoryRouteMap[parentRoute]!;
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
            const newDirectory: ViperDirectory = new ViperDirectory(id, directory, route);
            this.directoryRouteMap[route] = id;
            this.directoryMap[id] = newDirectory;
            directory.children[routeName(route)] = newDirectory;
            directory = newDirectory;
        }
        return directory;
    }

    #sortedPagesCache: ViperPage[] | undefined = void 0;
    get routeSortedPages(): ViperPage[] {
        if (!this.#sortedPagesCache)
            this.#sortedPagesCache = Object.values(this.pageMap).sort((a, b) => a.route.localeCompare(b.route));
        return this.#sortedPagesCache;
    }

    #sortedDirectoriesCache: ViperDirectory[] | undefined = void 0;
    get routeSortedDirectories(): ViperDirectory[] {
        if (!this.#sortedDirectoriesCache)
            this.#sortedDirectoriesCache = Object.values(this.directoryMap).sort((a, b) => a.route.localeCompare(b.route));
        return this.#sortedDirectoriesCache;
    }

    resetCaches(): Viper {
        this.#sortedPagesCache = void 0;
        this.#sortedDirectoriesCache = void 0;
        return this;
    }

    add(...items: ViperAddItem[]): Viper {
        for (const item of items) {
            item.route = normalRoute(item.route, this);
            if (isVirtualDataItem(item)) {
                const { route, data, isDirectoryData } = item;
                if (isDirectoryData) {
                    const { id } = this.getOrCreateDirectory(route);
                    if (id in this.virtualDataMap)
                        this.virtualDataMap[id]!.push(data);
                    else
                        this.virtualDataMap[id] = [data];
                } else if (route in this.pageRouteMap) {
                    const id = this.pageRouteMap[route]!;
                    if (id in this.virtualDataMap)
                        this.virtualDataMap[id]!.push(data);
                    else
                        this.virtualDataMap[id] = [data];
                } else {
                    if (route in this.pendingVirtualDataMap)
                        this.pendingVirtualDataMap[route]!.push(data);
                    else
                        this.pendingVirtualDataMap[route] = [data];
                }
            } else {
                if (item.route in this.pageRouteMap)
                    throw `Cannot add a duplicate page at: ${item.route}`;
                const id = this.getUniqueId();
                const parent = this.getOrCreateDirectory(item.route);
                const page = new ViperPage(id, parent, item);
                this.pageMap[id] = page;
                this.pageRouteMap[page.route] = id;
                parent.children[routeName(page.route)] = page;
                if (page.route in this.pendingVirtualDataMap) {
                    this.virtualDataMap[id] = this.pendingVirtualDataMap[page.route]!;
                    delete this.pendingVirtualDataMap[page.route];
                }
            }
        }
        return this.resetCaches();
    }

    getPageByID(id: string): ViperPage | undefined { return this.pageMap[id]; }
    getPageByRoute(route: string): ViperPage | undefined {
        route = normalRoute(route, this);
        if (!(route in this.pageRouteMap))
            return void 0;
        return this.pageMap[this.pageRouteMap[route]!];
    }

    getDirectoryById(id: string): ViperDirectory | undefined { return this.directoryMap[id]; }
    getDirectoryByRoute(route: string): ViperDirectory | undefined {
        route = normalRoute(route, this);
        if (!(route in this.directoryRouteMap))
            return void 0;
        return this.directoryMap[this.directoryRouteMap[route]!];
    }

    getVirtualItems(id: string): Record<string, any>[] | undefined { return this.virtualDataMap[id]; }

    move(old: string | ViperItem, newRoute: string): Viper {
        if (isViperPage(old))
            return this.movePage(old, newRoute);
        if (isViperDirectory(old))
            throw `Not implemented`;

        if (old in this.pageRouteMap) {
            const id = this.pageRouteMap[old]!;
            if (!(id in this.pageMap))
                throw `Cannot find page "${id}"`;
            return this.movePage(this.pageMap[id]!, newRoute);
        }

        if (old in this.directoryRouteMap) {
            const id = this.directoryRouteMap[old]!;
            if (!(id in this.directoryMap))
                throw `Cannot find directory "${id}"`;
            throw `Not implemented`;
        }

        throw `Cannot find route "${old}"`;
    }

    private movePage(page: ViperPage, newRoute: string): Viper {
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
        newParent.children[routeName(normal)] = page;

        return this.resetCaches();
    }

    removePage(page: ViperPage | string): Viper {
        if (typeof page === 'string') {
            if (!(page in this.pageMap))
                throw `Cannot find a page by ID: ${page}`;
            page = this.pageMap[page]!;
        }
        const { route, id, parent } = page;
        if (!(id in this.pageMap))
            throw `Page is not part of this instance`;
        if (!(route in this.pageRouteMap))
            throw `Page has an invalid route`;
        delete this.pageMap[id];
        delete this.pageRouteMap[route];
        delete this.virtualDataMap[id];
        delete parent.children[routeName(route)];
        return this.resetCaches();
    }

    use(...plugins: ViperPlugin[]): Viper {
        for (const plugin of plugins) {
            if (!this.pipeline)
                this.pipeline = new ViperPipeline(this);
            this.pipeline.use(plugin);
        }
        return this;
    }

    async build(): Promise<Viper> {
        if (!this.pipeline)
            return this;

        const context = new ViperContext(this, this.options);
        await this.pipeline.run(context);
        return this;
    }
}
