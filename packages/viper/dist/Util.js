"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncoding = exports.APPLICATION_OCTET_STREAM = exports.assertNever = exports.isBufferEncoding = void 0;
const chardet_1 = require("chardet");
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
function isBufferEncoding(candidate) {
    return typeof candidate === 'string' && candidate in BUFFER_ENCODINGS;
}
exports.isBufferEncoding = isBufferEncoding;
function assertNever(_, message) {
    throw message;
}
exports.assertNever = assertNever;
exports.APPLICATION_OCTET_STREAM = 'application/octet-stream';
function getEncoding(buffer, defaultEncoding) {
    const detected = chardet_1.detect(buffer);
    return isBufferEncoding(detected) ? detected : defaultEncoding;
}
exports.getEncoding = getEncoding;
//# sourceMappingURL=Util.js.map