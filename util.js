"use strict";

String.prototype.escapeXML = function () {
    return this.replace(/"/g, "\\\"");
};

exports.isValidString = x => x !== null && typeof x === "string" && x.length > 0;
exports.isNull = x => x === null || typeof x === "undefined";