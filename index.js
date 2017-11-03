"use strict";

const parsedArgs = require("minimist")(process.argv);
const utils = require("./util");
const parser = require("./parser");
const Exporter = require("./exporter");
const importer = require("./importer");
const os = require("os");
const newLine = os.EOL;

let importerInst = null;
const filePath = parsedArgs.src;
const destPath = parsedArgs.dst;
const action = parsedArgs.action;
const synergyUrl = parsedArgs.url; // "slc07ifc.us.oracle.com"
const isExport = utils.isValidString(action) && action.toLowerCase() === "export";

function handleImport() {
    if (!utils.isValidString(filePath) | !utils.isValidString(synergyUrl)) {
        console.error("Provide absolute path to specification file using --src argument and hostname where Synergy is running using --url argument (sample value e.g. services.netbeans.org)");
        process.exit(1);
    }
    parser
        .parse(filePath)
        .then(synergyImport => {
            // console.log(synergyImport);
            importerInst = new importer(synergyImport, synergyUrl);
            return importerInst.import();
        })
        .then(x => console.log(`${newLine}${newLine}Specification imported OK, url is '${x}' ${newLine}${newLine}`))
        .catch(e => {
            console.error(e);
            if (importerInst) {
                importerInst.revert()
                    .then(() => process.exit(1), () => process.exit(1));
            } else {
                process.exit(1);
            }

        });

}

function handleExport() {
    if (!utils.isValidString(destPath) | !utils.isValidString(filePath)) {
        console.error("Provide absolute URL to specification (see Permanent link in Synergy UI - e.g. http://services.netbeans.org/synergy/client/app/#/specification/383) using --src argument and absolute path to XML file where to save the specification using --dest");
        process.exit(1);
    }

  const exp =  new Exporter(filePath, destPath);
    exp
        .download()
        .then(jsonData => exp.toXML(jsonData))
        .then(xmlData => exp.saveToFile(xmlData))
        .then(x => console.log(`${newLine}${newLine}Specification exported OK, location is '${destPath}' ${newLine}${newLine}`))
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}


if (isExport) {
    handleExport();
} else {
    handleImport();
}