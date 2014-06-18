/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var ModelTrigger = require('./../../src/Model/ModelTrigger');

describe('ModelTrigger', function () {

    describe('execute', function () {
        var parameters = {
            'param1' : 1,
            'param2' : 2
        };

        it('should not call after if operation passes an error', function (done) {
            var operationCalled = false;
            var afterCalled = false;

            var operation = function (callback) {
                operationCalled = true;
                var error = {};
                callback(error);
            };
            var after = function (params, callback) {
                afterCalled = true;
                assert.equal(parameters, params);
                callback();
            };
            var trigger = new ModelTrigger(null, operation, after, function () {
                assert.equal(true, operationCalled);
                assert.equal(false, afterCalled);
                done();
            });
            trigger.execute(parameters);
        });

        it('should call before, operation and after passing the parameters', function (done) {
            var beforeCalled = false;
            var operationCalled = false;
            var afterCalled = false;

            var before = function (params, callback) {
                beforeCalled = true;
                assert.equal(parameters, params);
                callback(true);
            };
            var operation = function (callback) {
                operationCalled = true;
                callback();
            };
            var after = function (params, callback) {
                afterCalled = true;
                assert.equal(parameters, params);
                callback();
            };
            var trigger = new ModelTrigger(before, operation, after, function () {
                assert.equal(true, beforeCalled);
                assert.equal(true, operationCalled);
                assert.equal(true, afterCalled);
                done();
            });

            trigger.execute(parameters);
        });

        it('should function normally if before, operation and after are not functions', function (done) {
            var trigger = new ModelTrigger(null, null, null, function () {
                done();
            });

            trigger.execute(parameters);
        });

        it('should not call operation and after if false is passed to the before callback', function (done) {
            var beforeCalled = false;
            var operationCalled = false;
            var afterCalled = false;

            var before = function (params, callback) {
                beforeCalled = true;
                assert.equal(parameters, params);
                callback(false);
            };
            var operation = function (callback) {
                operationCalled = true;
                callback();
            };
            var after = function (params, callback) {
                afterCalled = true;
                assert.equal(parameters, params);
                callback();
            };
            var trigger = new ModelTrigger(before, operation, after, function () {
                assert.equal(true, beforeCalled);
                assert.equal(false, operationCalled);
                assert.equal(false, afterCalled);
                done();
            });

            trigger.execute(parameters);
        });
    });
});