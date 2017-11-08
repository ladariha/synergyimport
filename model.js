"use strict";

const util = require("./util");

function SynergyImport() {
    /**
     *
     * @type {SynergySpec}
     */
    this.specification = null;
    /**
     *
     * @type {SynergySuite[]}
     */
    this.suites = [];
}

let suiteOrder = 0;
let tcOrder = 1;

function SynergySpec(author, projectName, version, title, desc = "&nbsp;") {
    this.title = title;
    this.projectName = projectName;
    this.projectId = -1;
    this.author = author;
    this.version = version;
    this.description = desc.length === 0 ? "&nbsp;" : desc;
    this.id = -1;
    if (!util.isValidString(this.author) || !util.isValidString(this.title) || !util.isValidString(this.description) || !util.isValidString(this.projectName) || !util.isValidString(this.version)) {
        throw new Error(`Invalid specification object \n ${JSON.stringify(arguments)}`);
    }

}

SynergySpec.prototype.getPayload = function () {
    return {
        "title": this.title,
        "desc": this.description,
        "version": this.version,
        "owner": "",
        "author" : this.author,
        "id": -1,
        "isFavorite": 0,
        "simpleName": this.title,
        "testSuites": [],
        "ext": {"projects": [{"name": this.projectName, "id": this.projectId}]}
    };
};

function SynergyCase(title, steps, result, labels = [], duration = 1) {
    this.title = title;
    this.steps = steps;
    this.result = result;
    this.order = ++tcOrder;
    this.labels = labels.length === 1 ? labels[0].split(",") : labels; // uber ugly
    this.duration = parseInt(duration.constructor === Array ? duration[0] : duration, 10);// uber ugly #2
    this.id = -1;
    this.suiteId = -1;
    if (!util.isValidString(this.title)
        || !util.isValidString(this.steps)
        || !util.isValidString(this.result)) {
        throw new Error(`Invalid test case object \n ${JSON.stringify(arguments)}`);
    }

}

SynergyCase.prototype.getPayload = function () {
    return {
        "title": this.title,
        "steps": this.steps,
        "result": this.result,
        "duration": this.duration,
        "orginalDuration": this.duration,
        "id": -1,
        "suiteId": this.suiteId,
        "version": "",
        "order": this.order
    };
};

function SynergySuite(title, desc = "&nbsp;", testCases = []) {
    this.title = title;
    this.description = desc.length === 0 ? "&nbsp;" : desc;
    this.order = ++suiteOrder;
    this.id = -1;
    tcOrder = 0;
    /**
     *
     * @type {SynergyCase[]}
     */
    this.testCases = !testCases[0].testCase ? [] : testCases[0].testCase.map(x => new SynergyCase(x.title[0], x.steps[0], x.result[0], x.labels, x.duration));
    if (!util.isValidString(this.title) || !util.isValidString(this.description)) {
        throw new Error(`Invalid test suite object \n ${JSON.stringify(arguments)}`);
    }

}

SynergySuite.prototype.getPayload = function (specId) {
    return {
        "title": this.title,
        "desc": this.description,
        "product": -1,
        "component": -1,
        "specificationId": specId,
        "id": -1,
        "order": this.order,
        "testCases": []
    };
};

SynergyImport.prototype.setSpecification = function (author, projectName, version, title, description) {
    this.specification = new SynergySpec(author, projectName, version, title, description);
    return this;
};

SynergyImport.prototype.setSuites = function (suites) {
    this.suites = !suites[0].suite ? [] : suites[0].suite.map(s => new SynergySuite(s.title[0], s.description[0], s.testCases));
    return this;
};

module.exports = SynergyImport;