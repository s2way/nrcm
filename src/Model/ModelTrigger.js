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
function ModelTrigger(before, operation, after) {
    if (typeof before !== 'function') {
        before = function (params, callback) {
            this.params = params;
            callback(true);
        };
    }
    if (typeof after !== 'function') {
        after = function (params, callback) {
            this.params = params;
            callback();
        };
    }
    if (typeof operation !== 'function') {
        throw new exceptions.IllegalArgument();
    }
    this.before = before;
    this.operation = operation;
    this.after = after;
}

/**
 * Execute the triggers, if the operation fails it will not execute the after trigger
 *
 * @method execute
 * @param {json} params The parameters
 */
ModelTrigger.prototype.execute = function (params) {
    var that = this;
    this.before(params, function (continueOperation) {
        if (continueOperation === undefined || !continueOperation) {
            that.callback(new exceptions.OperationInterrupted());
        } else {
            that.operation(function (err) {
                if (err) {
                    that.callback(err);
                } else {
                    that.after(params, that.callback);
                }
            });
        }
    });
};

module.exports = ModelTrigger;