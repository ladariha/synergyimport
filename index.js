"use strict";

const parsedArgs = require("minimist")(process.argv);
const utils = require("./util");
const parser = require("./parser");
const importer = require("./importer");
const os = require("os");
const newLine = JSON.stringify(os.EOL);

let importerInst = null;
const filePath = parsedArgs.src;
const synergyUrl = parsedArgs.url; // "slc07ifc.us.oracle.com"

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
        }

    });
