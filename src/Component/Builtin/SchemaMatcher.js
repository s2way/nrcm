/*jslint devel: true, node: true, indent: 4, vars: true, stupid: true, nomen: true */
'use strict';

var exceptions = require('./../../exceptions.js');

/**
 * The matcher for the schema for all objects - model
 *
 *
 * @constructor
 * @method SchemaMatcher
 * @param {json} schema The json base schema to validate data
 */
function SchemaMatcher(schema) {
    this.schema = this._isJSONValid(schema);
    if (!this.schema) {
        throw new exceptions.IllegalArgument('Invalid schema!');
    }
}

SchemaMatcher.prototype._isJSONValid = function (jsonOb) {
    var newJSON;
    if (jsonOb === undefined || jsonOb === null) {
        return false;
    }
    try {
        newJSON = JSON.parse(JSON.stringify(jsonOb));
    } catch (e) {
        return false;
    }
    if (Object.getOwnPropertyNames(newJSON).length > 0) {
        return newJSON;
    }
    return false;
};

SchemaMatcher.prototype._matchAgainst = function (data, level, schema) {
    var n, test;
    if (level === undefined) {
        level = 1;
        schema = this.schema;
    } else {
        level += 1;
    }
    // check schema field presence
    for (n in data) {
        if (data.hasOwnProperty(n)) {
            // schema for this field was not set, block
            if (schema[n] === undefined) {
                return { 'field' : n, 'level' : level, 'error' : 'denied' };
            }
            // schema set and it is an object: recursive
            if (typeof schema[n] === 'object') {
                test = this._matchAgainst(data[n], level, schema[n]);
                if (test !== true) {
                    return test;
                }
            }
        }
    }
    // check for required fields
    for (n in schema) {
        if (schema.hasOwnProperty(n)) {
            if (schema[n] === true && data[n] === undefined) {
                // required field not present
                return { 'field' : n, 'level' : level, 'error' : 'required' };
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
    var newData = this._isJSONValid(data);
    if (!newData) {
        throw new exceptions.IllegalArgument('The data is invalid!');
    }
    return this._matchAgainst(data);
};

module.exports = SchemaMatcher;