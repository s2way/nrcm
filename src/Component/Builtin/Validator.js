/*jslint devel: true, node: true, indent: 4, vars: true, stupid: true, nomen: true */
'use strict';

var exceptions = require('../../exceptions');

/**
 * The validator object
 *
 * @constructor
 * @method Validator
 * @param {object} params Must contain the validation rules (validate property) and may contain the timeout (in millis)
 */
function Validator(params) {
    params = params || {};
    this.timeout = params.timeout || 10000;
    this.validate = params.validate;
}

// Validate fields
Validator.prototype._succeeded = function (validatedFields) {
    var key;
    for (key in validatedFields) {
        if (validatedFields.hasOwnProperty(key)) {
            if (typeof validatedFields[key] !== 'object') {
                if (validatedFields[key] === false) {
                    return false;
                }
            } else if (!this._succeeded(validatedFields[key])) {
                return false;
            }
        }
    }
    return true;
};

// Find all fields to validate
Validator.prototype._hasValidatedAllFields = function (validatedFields, validate) {
    var key;
    for (key in validate) {
        if (validate.hasOwnProperty(key)) {
            if (typeof validate[key] !== 'object' || validate[key] instanceof Array) {
                if (validatedFields[key] === undefined) {
                    return false;
                }
            } else {
                if (validatedFields[key] === undefined) {
                    validatedFields[key] = {};
                }
                if (!this._hasValidatedAllFields(validatedFields[key], validate[key])) {
                    return false;
                }
            }
        }
    }
    return true;
};

// isValid
Validator.prototype._isValid = function (data, validatedFields, validate, originalData) {
    var n;

    var validateFunctionCallback = function (valid) {
        validatedFields[n] = valid;
    };

    for (n in data) {
        if (data.hasOwnProperty(n)) {
            if (typeof data[n] !== 'object' || Array.isArray(data[n])) {
                if (typeof validate[n] === 'function') {
                    validate[n](data[n], originalData, validateFunctionCallback);
                }
            } else {
                if (validatedFields[n] === undefined) {
                    validatedFields[n] = {};
                }
                if (validate[n] !== undefined) {
                    this._isValid(data[n], validatedFields[n], validate[n], originalData);
                }
            }
        }
    }
};
/**
 * Validate all properties of a json
 *
 * @method isValid
 * @param {json} data The json object to be validated
 * @param {function} callback
 */
Validator.prototype.isValid = function (data, callback) {
    var validate = this.validate;
    var validatedFields = {};
    var that = this;
    var expired = false;
    // Fire all validations callbacks
    this._isValid(data, validatedFields, validate, data);
    // Start a timer to control validations
    var timer = setTimeout(function () {
        expired = true;
    }, this.timeout);
    // Timeout
    var timeoutFunc = function () {
        if (expired) {
            callback(true, false, validatedFields);
        } else if (that._hasValidatedAllFields(validatedFields, validate)) {
            clearTimeout(timer);
            callback(false, that._succeeded(validatedFields), validatedFields);
        } else {
            setTimeout(timeoutFunc, that.timeout / 500);
        }
    };
    timeoutFunc();
};


Validator.prototype._matchAgainst = function (data, level, validate) {
    var n, test;
    if (level === undefined) {
        level = 1;
        validate = this.validate;
    } else {
        level += 1;
    }
    // check schema field presence
    for (n in data) {
        if (data.hasOwnProperty(n)) {
            // schema for this field was not set, block
            if (validate[n] === undefined) {
                return { 'field' : n, 'level' : level, 'error' : 'denied' };
            }
            // validate set and it is an object: recursive
            if (typeof validate[n] === 'object') {
                test = this._matchAgainst(data[n], level, validate[n]);
                if (test !== true) {
                    return test;
                }
            }
        }
    }
    // check for required fields
    for (n in validate) {
        if (validate.hasOwnProperty(n)) {
            if (validate[n] === true && data[n] === undefined) {
                // required field not present
                return { 'field' : n, 'level' : level, 'error' : 'required' };
            }
        }
    }
    return true;
};

Validator.prototype._isJSONValid = function (jsonOb) {
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

/**
 * Match the data against the validate object specified in the constructor
 * If there are fields in the data that are not specified in the validate object, this method returns false
 * @param {object} data The data to be matched
 * @return {boolean}
 */
Validator.prototype.match = function (data) {
    var newData = this._isJSONValid(data);
    if (!newData) {
        throw new exceptions.IllegalArgument('The data is invalid!');
    }
    return this._matchAgainst(data);
};


module.exports = Validator;
