"use strict";

const http = require("http");

function Importer(parsedData, baseSynergyUrl) {
    this.projectId = -1;
    /**
     * @type SynergyImport
     */
    this.parsedData = parsedData;
    this.baseURL = baseSynergyUrl;
    this.specURL = null;
}

Importer.prototype._makeRequest = function (uri, payload = null, method = "POST") {
    const self = this;
    return new Promise((resolve, reject) => {
        const options = {
            hostname: self.baseURL,
            path: uri,
            method: method,
            headers: {
                "Content-Type": "application/json"

            }
        };
        console.log(`Sending ${method} request to ${self.baseURL + uri}`);
        const req = http.request(options, function (res) {
            res.setEncoding("utf8");
            let output = "";
            res.on("data", function (body) {
                output += body;
            });

            res.on("end", function () {
                if (res.statusCode > 199 && res.statusCode < 300) {
                    // console.log(`Response: ${output}`);
                    let r = "";
                    try {
                        r = JSON.parse(output);
                    } catch (e) {
                        // console.error(e);
                    }

                    resolve(r);
                } else {
                    reject(output);
                }

            });

        });
        req.on("error", function (e) {
            console.log("problem with request: " + e.message);
            reject(e);
        });
// write data to request body
        payload !== null && req.write(JSON.stringify(payload));
        req.end();
    });
};

Importer.prototype.import = function () {
    const self = this;
    return this._getProjectId()
        .then(() => self._createSpecification())
        .then(() => {
            return self.parsedData.suites.reduce((acc, currentSuite) => acc.then(() => self._createSuite(currentSuite)), Promise.resolve());
        })
        .then(() => {
            const cases = [];
            self.parsedData.suites.forEach(x => cases.push(...x.testCases));
            return cases.reduce((acc, currentCase) => acc.then(() => self._createTestCase(currentCase)), Promise.resolve());

        })
        .then(() => {
            const labels = [];
            self.parsedData.suites.forEach(x => {
                x.testCases.forEach(c => {
                    labels.push(...c.labels.map(l => ({label: l, testCaseId: c.id, suiteId: x.id})));
                });
            });
            return labels.reduce((acc, currentLabel) => acc.then(() => self._addLabel(currentLabel)), Promise.resolve());

        })
        .then(() => Promise.resolve(self.specURL));
};

Importer.prototype._createSpecification = function () {
    const self = this;
    return this._makeRequest("/synergy/server/api/specification.php?mode=create&anonym=import", this.parsedData.specification.getPayload(), "POST")
        .then(response => {
            self.parsedData.specification.id = parseInt(/[0-9]+$/.exec(response)[0], 10);
            self.specURL = `http://${self.baseURL}/synergy/client/app/#/specification/${self.parsedData.specification.id}/v/2`;
            console.log(`Specification with id '${self.parsedData.specification.id}' created`);
        });
};
Importer.prototype._removeSpecification = function () {
    const self = this;
    return this._makeRequest(`/synergy/server/api/specification.php?id=${this.parsedData.specification.id}&anonym=import`, null, "DELETE")
        .then(() => console.log(`Specification with id '${self.parsedData.specification.id}' removed`));
};

Importer.prototype._addLabel = function ({label, suiteId, testCaseId}) {
    return this._makeRequest("/synergy/server/api/label.php?anonym=import", {
        label: label,
        suiteId: `${suiteId}`,
        testCaseId: `${testCaseId}`
    }, "POST")
        .then(() => {
            console.log(`Label '${label}' added to test case '${testCaseId}'`);
        });
};

Importer.prototype._getProjectId = function () {
    const self = this;
    return this._makeRequest("/synergy/server/api/projects.php", null, "GET")
        .then(response => {
            const matchingProject = response.find(x => x.name.toLowerCase() === self.parsedData.specification.projectName.toLowerCase());
            if (matchingProject) {
                console.log(`Project '${self.parsedData.specification.projectName}' found, id is '${matchingProject.id}'`);
                self.parsedData.specification.projectId = matchingProject.id;
                return self.projectId;
            } else {
                throw new Error(`Project '${self.parsedData.specification.projectName}' not found in Synergy`);
            }
        });
};

/**
 *
 * @param {SynergySuite} suite
 * @returns {Promise.<TResult>}
 * @private
 */
Importer.prototype._createSuite = function (suite) {
    return this._makeRequest("/synergy/server/api/suite.php?id=-1&anonym=import", suite.getPayload(this.parsedData.specification.id), "POST")
        .then(response => {
            suite.id = parseInt(/[0-9]+$/.exec(response)[0], 10);
            suite.testCases.forEach(x => x.suiteId = suite.id);
            console.log(`Suite '${suite.title}' with id '${suite.id}' created`);
        });
};
/**
 *
 * @param {SynergyCase} testCase
 * @returns {Promise.<TResult>}
 * @private
 */
Importer.prototype._createTestCase = function (testCase) {
// POST http://services.netbeans.org/synergy/server/api/case.php
    return this._makeRequest("/synergy/server/api/case.php?anonym=import", testCase.getPayload(), "POST")
        .then(response => {
            testCase.id = parseInt(/[0-9]+$/.exec(response)[0], 10);
            console.log(`Test case '${testCase.title}' with id '${testCase.id}' created`);
        });
};

Importer.prototype.revert = function () {
    return this.parsedData.specification.id !== -1 ? this._removeSpecification() : Promise.resolve();
};

module.exports = Importer;