/*jslint devel: true, node: true, indent: 4, vars: true, stupid: true, nomen: true */
'use strict';

/**
 * XML Utils
 * @constructor
 */
function XML() {
    this.xml2js = require('xml2js');
    this.options = {
        'attrkey' : '@',
        'charkey' : '#'
    };
}

/**
 * Convert a JSON object to a XML string
 * @param {object} json The JSON object
 * @returns {string} The XML String
 */
XML.prototype.fromJSON = function (json) {
    var builder = new this.xml2js.Builder(this.options);
    var xml = builder.buildObject(json);
    return xml;
};

/**
 * Convert a XML string to a JSON object
 * @param {string} xml The XML string to be converted
 * @returns {json} The JSON converted
 */
XML.prototype.toJSON = function (xml) {
    var json = null;
    // This is NOT async!
    var parser = new this.xml2js.Parser(this.options);
    parser.parseString(xml, function (err, result) {
        json = result;
        if (err) {
            throw err;
        }
    });
    return json;
};

module.exports = XML;