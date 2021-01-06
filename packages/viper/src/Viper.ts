import { isAbsolute, basename, dirname, posix } from 'path';
import { NonEmptyArray, last, isNonEmptyArray } from './NonEmptyArray';
import { assertNever } from './Util';
import { ViperContext } from './ViperContext';
import { ViperDirectory, ViperPage, ViperVirtualItem, ViperItemType, ViperNonPage, ViperNonDirectory, isViperVirtualItem } from "./ViperItem";
import { hasViperVirtualInnerItem } from './ViperItem';
import { ViperPipeline } from './ViperPipeline';
import type { ViperPlugin } from './ViperPlugin';
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
function routeParts(route: string): string[] {
    const parts = [];
    while (route !== '/') {
        parts.unshift(basename(route));
        route = dirname(route);
    }
    return parts;
}

export type MergeType = 'shallow' | 'deep' | 'none';
export type ViperOptions = {
    mergeType: MergeType
};

type ViperConstructorType =
    | [route?: string]
    | [options: ViperOptions]
    | [route: string, options: ViperOptions];
export class Viper {
    private pageRouteMap: Record<string, ViperPage> = {};
    private directoryRouteMap: Record<string, ViperDirectory> = {};
    private virtualRouteMap: Record<string, NonEmptyArray<ViperVirtualItem>> = {};
    private root: ViperDirectory;

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
        this.root = new ViperDirectory(this.route);
        this.directoryRouteMap[this.route] = this.root;
    }

    private getParent(ownRoute: string): ViperNonPage {
        if (ownRoute in this.virtualRouteMap)
            return last(this.virtualRouteMap[ownRoute]!);
        const parentRoute = routeParent(ownRoute);
        if (parentRoute in this.directoryRouteMap)
            return this.directoryRouteMap[parentRoute]!;

        const parts = routeParts(parentRoute);
        let directory: ViperDirectory = this.root;
        for (const part of parts) {
            // if we get here, we've already checked that it isn't a page, and neither a
            // directory or virtual item exist, so we just need to traverse and insert.
            if (part in directory.children) {
                let item = directory.children[part]!;
                while (hasViperVirtualInnerItem(item))
                    item = item.inner;

                // Viper's constructor registers itself with the directory map, so no need
                // to do anything special.
                switch (item.type) {
                    case ViperItemType.Virtual:
                        directory = item.inner = new ViperDirectory(normalRoute(`${directory.route}/${part}`, this));
                        this.directoryRouteMap[directory.route] = directory;
                        break;
                    case ViperItemType.Directory:
                        directory = item;
                        break;
                    case ViperItemType.Page:
                        throw `Encountered a page while traversing the directory tree for a directory.`;
                    default:
                        return assertNever(item, `Illegal item type.`);
                }
            } else {
                const newDirectory = new ViperDirectory(normalRoute(`${directory.route}/${part}`, this));
                directory.children[part] = newDirectory;
                directory = newDirectory;
                this.directoryRouteMap[directory.route] = directory;
            }
        }
        return directory;
    }

    add(...items: ViperNonDirectory[]) {
        for (const item of items) {
            if (item.type === ViperItemType.Page)
                this.addPage(item);
            else
                this.addVirtual(item);
        }
    }

    addPage(...pages: ViperPage[]): Viper {
        for (const page of pages) {
            const route = normalRoute(page.route, this);

            if (route in this.pageRouteMap)
                throw `Cannot add duplicate page at: ${route}`;
            this.pageRouteMap[route] = page;

            const parent = this.getParent(route);
            page.route = route;
            page.parent = parent;
            if (parent.type === ViperItemType.Virtual)
                parent.inner = page;
            else
                parent.children[routeName(route)] = page;
        }
        return this;
    }

    addVirtual(...virtuals: ViperVirtualItem[]): Viper {
        for (const item of virtuals) {
            const route = normalRoute(item.route, this);

            if (item.inner)
                throw `Cannot add a virtual item with an inner value already set: ${route}`;

            const parent = this.getParent(route);
            item.route = route;
            item.parent = parent;
            if (parent.type === ViperItemType.Virtual) {
                parent.inner = item;
            } else {
                const name = routeName(route);
                if (name in parent.children) {
                    item.inner = parent.children[name];
                    item.inner!.parent = item;
                }
                parent.children[name] = item;
            }

            // add to map after setting parent so we don't create a circular link in getParent().
            if (route in this.virtualRouteMap)
                this.virtualRouteMap[route]!.push(item);
            else
                this.virtualRouteMap[route] = [item];
        }
        return this;
    }

    getPage(route: string): ViperPage | null { return this.pageRouteMap[normalRoute(route, this)] ?? null; }
    getDirectory(route: string): ViperDirectory | null { return this.directoryRouteMap[normalRoute(route, this)] ?? null; }
    getVirtualItems(route: string): ViperVirtualItem[] | null { return this.virtualRouteMap[normalRoute(route, this)] ?? null; }

    replacePage(oldPage: ViperPage, newPage: ViperPage, virtuals: 'move' | 'preserve' = 'move') {
        let { parent } = oldPage;
        this.removePage(oldPage);
        if (virtuals === 'move' && oldPage.route !== newPage.route && isViperVirtualItem(parent)) {
            delete parent.inner;
            while (isViperVirtualItem(parent.parent))
                parent = parent.parent;
            this.moveVirtual(parent, normalRoute(newPage.route, this));
        }
        this.addPage(newPage);
    }

    move(oldRoute: string, newRoute: string): Viper {
        if (oldRoute in this.virtualRouteMap)
            this.moveVirtual(this.virtualRouteMap[oldRoute]![0], newRoute);
        else if (oldRoute in this.pageRouteMap)
            this.movePage(this.pageRouteMap[oldRoute]!, newRoute);
        else if (oldRoute in this.directoryRouteMap)
            throw `Not implemented: cannot move directories`;
        else
            throw `Route is not part of this instance.`
        return this;
    }

    movePage(page: ViperPage, newRoute: string): Viper {
        const oldRoute = page.route;
        const oldParent = page.parent;
        if (!(oldRoute in this.pageRouteMap))
            throw `Page is not part of this instance.`;
        const normal = normalRoute(newRoute, this);
        if (normal in this.pageRouteMap)
            throw `Cannot move page to occupied route`;
        if (normal === page.route)
            return this;

        this.pageRouteMap[normal] = page;
        page.parent = this.getParent(normal);
        page.route = normal;
        delete this.pageRouteMap[oldRoute];

        if (oldParent) {
            const oldName = routeName(oldRoute);
            if (oldParent.type === ViperItemType.Directory)
                delete oldParent.children[oldName];
            else
                delete oldParent.inner;
        }

        if (page.parent) {
            const name = routeName(normal);
            if (page.parent.type === ViperItemType.Directory)
                page.parent.children[name] = page;
            else
                page.parent.inner = page;
        }
        return this;
    }

    moveVirtual(item: ViperVirtualItem, newRoute: string): Viper {
        if (!(item.route in this.virtualRouteMap))
            throw `Virtual is not part of this instance.`;
        const normal = normalRoute(newRoute, this);

        // remove entry in map
        const newList = this.virtualRouteMap[item.route]!.filter(a => a !== item);
        if (isNonEmptyArray(newList))
            this.virtualRouteMap[item.route] = newList;
        else
            delete this.virtualRouteMap[item.route];

        // break link from parent
        if (item.parent) {
            switch (item.parent.type) {
                case ViperItemType.Directory:
                    const name = routeName(item.route);
                    delete item.parent.children[name];
                    break;
                case ViperItemType.Virtual:
                    delete item.parent.inner;
                    break;
                default:
                    return assertNever(item.parent, `Unrecognized parent type.`);
            }
        }

        // graft to new parent
        const newParent = this.getParent(normal);
        item.parent = newParent;
        if (newParent.type === ViperItemType.Virtual) {
            newParent.inner = item;
        } else {
            const name = routeName(normal);
            if (name in newParent.children)
                throw `Collision with existing directory child while moving virtual item`;
            newParent.children[name] = item;
        }

        // set new route
        item.route = normal;

        // add back to map
        if (normal in this.virtualRouteMap)
            this.virtualRouteMap[normal]!.push(item);
        else
            this.virtualRouteMap[normal] = [item];

        // repair children
        if (item.inner) {
            delete item.inner.parent;
            switch (item.inner.type) {
                case ViperItemType.Directory:
                    throw `Not implemented: cannot move a directory transitive inner.`;
                case ViperItemType.Page:
                    this.movePage(item.inner, normal);
                    break;
                case ViperItemType.Virtual:
                    this.moveVirtual(item.inner, normal);
                    break;
                default:
                    return assertNever(item.inner, `Unknown item type`);
            }
        }
        return this;
    }

    removePage(page: ViperPage): Viper {
        const { route, parent } = page;
        if (!(route in this.pageRouteMap))
            throw `Page is not part of this instance.`;
        delete this.pageRouteMap[route];
        if (parent) {
            if (parent.type === ViperItemType.Directory)
                delete parent.children[routeName(route)];
            else
                delete parent.inner;
        }
        return this;
    }

    removeVirtual(item: ViperVirtualItem, child: 'discard' | 'condense' | 'preserve' = 'condense'): Viper {
        if (!item.parent)
            throw `Cannot remove an item with no parent.`;
        if (!(item.route in this.virtualRouteMap))
            throw `Virtual is not part of this instance.`;

        // break parent link
        switch (item.parent.type) {
            case ViperItemType.Virtual:
                delete item.parent.inner;
                break;
            case ViperItemType.Directory:
                delete item.parent.children[routeName(item.route)];
                break;
            default:
                return assertNever(item.parent, `Unknown item type`);
        }

        // remove this item from the map.
        const newList = this.virtualRouteMap[item.route]!.filter(a => a !== item);
        if (isNonEmptyArray(newList))
            this.virtualRouteMap[item.route] = newList;
        else
            delete this.virtualRouteMap[item.route];

        // deal with the child if one exists.
        if (item.inner) {
            switch (child) {
                case 'discard':
                    switch (item.inner.type) {
                        case ViperItemType.Virtual:
                            this.removeVirtual(item.inner, child);
                            break;
                        case ViperItemType.Page:
                            this.removePage(item.inner);
                            break;
                        case ViperItemType.Directory:
                            throw `Not implemented: cannot remove a child directory.`;
                        default:
                            return assertNever(item.inner, `Unknown item type`);
                    }
                    break;
                case 'condense':
                    item.inner.parent = item.parent;
                    if (isViperVirtualItem(item.parent))
                        item.parent.inner = item.inner;
                    else
                        item.parent.children[routeName(item.inner.route)] = item.inner;
                    break;
                case 'preserve':
                    // do nothing
                    break;
                default:
                    return assertNever(child, `Illegal strategy for children: ${child}`);
            }
        }

        return this;
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
        await this.pipeline.run(context, {
            pageRouteMap: this.pageRouteMap,
            virtualRouteMap: this.virtualRouteMap,
            directoryRouteMap: this.directoryRouteMap
        });
        return this;
    }
}
