/*jslint devel: true, node: true, indent: 4, vars: true, stupid: true, nomen: true */
'use strict';
var exceptions = require('./../exceptions.js');

SchemaMatcher.prototype._isValidJson = function (jsonOb) {
    if (jsonOb === undefined || jsonOb == null) {
        return false;
    }
    try {
        var newJson = JSON.parse(JSON.stringify(jsonOb));
    } catch (e) {
        return false;
    }
    if (Object.getOwnPropertyNames(newJson).length > 0) {
        return newJson;
    }
    return false;
};

/**
 * The matcher for the schema for all jsson objects - model
 *
 * @constructor
 * @method SchemaMatcher
 * @param {json} schema The json base schema to validate data
 */
function SchemaMatcher (schema) {
    this.schema = this._isValidJson(schema);
    if (this.schema === false) {
        throw new exceptions.IllegalArgument('The schema is invalid!');
    }    
};

SchemaMatcher.prototype._matchAgainst = function (data, level, schema) {
    var n;
    if (level === undefined) {
        level = 1;
        schema = this.schema;
    } else {
        level += 1;
    }
    for (n in data) {
        if (data.hasOwnProperty(n)) {            
            if (Array.isArray(data[n])) {
                if (!Array.isArray(schema[n])) {
                    return false;
                }
            } else if (typeof data[n] === 'object') {
                if (typeof schema[n] === 'object') {
                    if (this._matchAgainst(data[n], level, schema[n]) === false) {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                if (typeof data[n] !== typeof schema[n]) {   
                    return false;
                }
            }
        }
    }
    return true;
};

/**
 * The matcher for the schema for all jsson objects
 *
 * @method match
 * @param {json} data The data to be compared against the json schema
 * @return {Boolean} 
 */
SchemaMatcher.prototype.match = function (data) {
    var newData = this._isValidJson(data);
    if (!newData) {
        throw new exceptions.IllegalArgument('The data is invalid!');
    } else {
        return this._matchAgainst(data);    
    }    
};

module.exports = SchemaMatcher;