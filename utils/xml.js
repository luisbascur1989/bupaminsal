let convert = require('xml-js');

const xml2string = (xmlstr) => {
    try {
        return convert.xml2json(xmlstr, { compact: true, spaces: 2 });
    } catch (err) {
        console.log("ERR =>", err);
        return { error: err }
    }
}

module.exports = xml2string