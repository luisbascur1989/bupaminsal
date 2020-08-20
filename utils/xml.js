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

const json2xml = (jsonstr) => {
    try {
        return convert.json2xml(jsonstr, { compact: true, spaces: 2 });
    } catch (err) {
        console.log("ERR =>", err);
        return { error: err }
    }
}

module.exports = json2xml