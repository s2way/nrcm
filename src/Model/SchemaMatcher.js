/*jslint devel: true, node: true, indent: 4, vars: true, stupid: true, nomen: true */
'use strict';
var exceptions = require('./../exceptions.js');
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
}

SchemaMatcher.prototype._isValidJson = function (jsonOb) {
    var newJson;
    if (jsonOb === undefined || jsonOb == null) {
        return false;
    }
    try {
        newJson = JSON.parse(JSON.stringify(jsonOb));
    } catch (e) {
        return false;
    }
    if (Object.getOwnPropertyNames(newJson).length > 0) {
        return newJson;
    }
    return false;
};

SchemaMatcher.prototype._matchAgainst = function (data, level, schema) {
    var n, typeData, typeSchema;
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
                    if (!this._matchAgainst(data[n], level, schema[n])) {
                        return false;
                    }
                }
            } else {
                typeData = typeof data[n];
                typeSchema = typeof schema[n];
                if (typeData !== typeSchema) {
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
    } 
    return this._matchAgainst(data);
};

module.exports = SchemaMatcher;