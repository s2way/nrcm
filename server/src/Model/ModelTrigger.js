/*jslint devel: true, node: true, indent: 4 */
'use strict';
var exceptions = require('./../exceptions');

/**
 * The ModelTrigger object
 *
 * @constructor
 * @method ModelTrigger
 * @param {function} before The before trigger to execute
 * @param {function} operation The operation trigger to execute
 * @param {function} after The after trigger to execute
 * @param {function} callback
 */
function ModelTrigger(before, operation, after, callback) {
    if (typeof before !== 'function') {
        before = function (beforeCallback) {
            beforeCallback(true);
        };
    }
    if (typeof after !== 'function') {
        after = function (afterCallback, err, result) {
            afterCallback(err, result);
        };
    }
    if (typeof operation !== 'function') {
        operation = function (err) {
            callback(err);
        };
    }
    if (typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('callback is mandatory');
    }
    this.before = before;
    this.operation = operation;
    this.after = after;
    this.callback = callback;
}

/**
 * Execute the triggers, if the operation fails it will not execute the after trigger
 *
 * @method execute
 */
ModelTrigger.prototype.execute = function () {
    var that = this;
    this.before(function (continueOperation) {
        if (continueOperation === undefined || !continueOperation) {
            that.callback(new exceptions.OperationInterrupted());
        } else {
            that.operation(function (err, result) {
                if (err) {
                    that.callback(err);
                } else {
                    that.after(that.callback, err, result);
                }
            });
        }
    });
};

module.exports = ModelTrigger;