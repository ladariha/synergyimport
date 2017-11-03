"use strict";

const http = require("http");
const url = require("url");
const fs = require("fs");
//url like client/app/#/specification/383
const EXPECTED_URL_REGEX = /(.+synergy)\/client\/app\/#\/specification\/([0-9]+)$/;

function Exporter(url, destination) {
    this.url = url;
    this.dst = destination;
}

Exporter.prototype._makeRequest = function (uri, method = "GET") {
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

        req.end();
    });
};

Exporter.prototype.download = function () {
    const m = this.url.match(EXPECTED_URL_REGEX);
    if (!m) {
        throw new Error(`Invalid specification URL, please use url in form of 'http://services.netbeans.org/synergy/client/app/#/specification/383' - as displayed in Synergy UI, provided URL ${this.url}`);
    }
    let x = url.parse(this.url);
    this.baseURL = x.host;
    return this._makeRequest(`/synergy/server/api/specification.php?&view=cont&id=${m[2]}`);
};

Exporter.prototype.saveToFile = function (xmlData) {
    return new Promise((resolve, reject) => {
        fs.writeFile(this.dst, xmlData, (err) => {
            // throws an error, you could also catch it here
            if (err) {
                reject(err);
            } else {
                resolve();
            }

        });
    });


};

Exporter.prototype.toXML = function (jsonData) {
    let xmlString = "<?xml version=\"1.0\" standalone=\"yes\" ?>\n";

    xmlString += `<specification project="${jsonData.ext.projects[0].name.escapeXML()}" version="${jsonData.version.escapeXML()}" author="${jsonData.author.escapeXML()}">\n`;


    xmlString += `<title>${jsonData.title}</title>\n`;
    xmlString += `<description><![CDATA[ ${jsonData.desc} ]]></description>\n`;
    xmlString += "<suites>\n";

    jsonData.testSuites.forEach(t => {
        xmlString += "<suite>\n";
        xmlString += `<title>${t.title}</title>\n`;
        xmlString += `<description><![CDATA[ ${t.desc} ]]></description>\n`;
        xmlString += "<testCases>\n";

        t.testCases.forEach(c => {
            xmlString += "<testCase>\n";
            xmlString += `<title>${c.title}</title>\n`;
            if(c.steps && c.steps.indexOf("]]>") > -1){
                c.steps = c.steps.replace(/\]\]\>/g, "]]&gt;");
            }
            xmlString += `<steps><![CDATA[ ${c.steps} ]]></steps>\n`;
            xmlString += `<result><![CDATA[ ${c.result} ]]></result>\n`;

            if (c.keywords) {
                xmlString += `<labels>${c.keywords}</labels>\n`;
            }
            xmlString += `<duration>${c.duration}</duration>\n`;
            xmlString += "</testCase>\n";
        });

        xmlString += "</testCases>\n";
        xmlString += "</suite>\n";
    });

    xmlString += "</suites>\n";


    return Promise.resolve(xmlString + "\n</specification>");

};

module.exports = Exporter;