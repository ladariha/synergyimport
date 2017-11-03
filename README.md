# synergyimport
Imports XML specifications to Synergy TCM
To run:

    npm install
    # to import xml to Synergy
    node index.js --src=/tmp/synergyimport/sample.xml --url=hostname
    # to export Synergy specification to XML file
    node index.js --src=http://services.netbeans.org/synergy/client/app/#/specification/383 --dst=/bck.xml --action=export

