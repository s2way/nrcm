"use strict";

var path = require('path');

/**
 * WaferPie utils class
 * @constructor
 */
function Cherries() {
    return;
}

/**
 * Convert a given element name (model, controller, component) to the adequate path
 * @param {string} elementName The name of the element separated by dots (Remote.Model, for example)
 * @returns {string} The equivalent path (Remote/Model)
 */
Cherries.prototype.elementNameToPath = function (elementName) {
    return elementName.replace(/\./g, path.sep);
};

/**
 * Perform a deep copy of an object
 * Removes unserializable properties (functions, for example)
 * @param {object} object The object to be copied
 * @returns {*}
 */
Cherries.prototype.copy = function (object) {
    return JSON.parse(JSON.stringify(object));
};

module.exports = Cherries;