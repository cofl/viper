import { detect } from "chardet";

const BUFFER_ENCODINGS = {
    "ascii": true,
    "utf8": true,
    "utf-8": true,
    "utf16le": true,
    "ucs2": true,
    "ucs-2": true,
    "base64": true,
    "latin1": true,
    "binary": true,
    "hex": true
};
export function isBufferEncoding(candidate: any): candidate is BufferEncoding {
    return typeof candidate === 'string' && candidate in BUFFER_ENCODINGS;
}

export function assertNever(_: never, message: any): never {
    throw message;
}

export const APPLICATION_OCTET_STREAM = 'application/octet-stream';

export function getEncoding<T extends BufferEncoding | undefined>(buffer: Buffer, defaultEncoding: T): BufferEncoding | T {
    const detected = detect(buffer);
    return isBufferEncoding(detected) ? detected : defaultEncoding;
}
