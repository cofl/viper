export type NonEmptyArray<T> = { 0: T; } & T[];
export function last<T>(list: NonEmptyArray<T>): T {
    return list[list.length - 1]!;
}

export function isNonEmptyArray<T>(candidate: T[]): candidate is NonEmptyArray<T>;
export function isNonEmptyArray<T>(candidate: any): candidate is NonEmptyArray<T> {
    return Array.isArray(candidate) && candidate.length > 0;
}
