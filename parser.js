"use strict";

const fs = require("fs");
const xml2js = require("xml2js");
const SynergyImport = require("./model");

function readFile(src) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(src)) {
            reject(`File '${src}' not found`);
        } else {
            fs.readFile(src, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }
    });
}

function parseXML(xmlString) {
    return new Promise((resolve, reject) => {
        new xml2js.Parser().parseString(xmlString, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function createModel(parsedData) {
    const p = new SynergyImport();
    const attr = parsedData.specification["$"];
    p.setSpecification(attr.project, attr.version, parsedData.specification.title[0], parsedData.specification.description[0])
        .setSuites(parsedData.specification.suites);
    return Promise.resolve(p);
}

exports.parse = filePath => {
    return readFile(filePath)
        .then(parseXML)
        .then(createModel);
};