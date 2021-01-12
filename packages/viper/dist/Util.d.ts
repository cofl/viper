/// <reference types="node" />
export declare function isBufferEncoding(candidate: any): candidate is BufferEncoding;
export declare function assertNever(_: never, message: any): never;
export declare const APPLICATION_OCTET_STREAM = "application/octet-stream";
export declare function getEncoding<T extends BufferEncoding | undefined>(buffer: Buffer, defaultEncoding: T): BufferEncoding | T;
