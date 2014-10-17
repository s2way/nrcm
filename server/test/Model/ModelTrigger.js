/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var ModelTrigger = require('./../../src/Model/ModelTrigger');

describe('ModelTrigger', function () {

    describe('execute', function () {
        it('should not call after if operation passes an error', function (done) {
            var operationCalled = false;
            var afterCalled = false;

            var operation = function (callback) {
                operationCalled = true;
                callback('an error', {});
            };
            var after = function (callback, result, err) {
                afterCalled = true;
                callback(result, err);
            };
            var trigger = new ModelTrigger(null, operation, after, function (err) {
                assert.equal(true, operationCalled);
                assert.equal(false, afterCalled);
                assert.equal('an error', err);
                done();
            });
            trigger.execute();
        });

        it('should call before, operation and after if no error is passed', function (done) {
            var beforeCalled = false;
            var operationCalled = false;
            var afterCalled = false;

            var before = function (callback) {
                beforeCalled = true;
                callback(true);
            };
            var operation = function (callback) {
                operationCalled = true;
                callback(false, {});
            };
            var after = function (callback, err, result) {
                afterCalled = true;
                assert.equal(false, err);
                assert.equal(JSON.stringify({}), JSON.stringify(result));
                callback(err, result);
            };
            var trigger = new ModelTrigger(before, operation, after, function (err, result) {
                assert.equal(true, beforeCalled);
                assert.equal(true, operationCalled);
                assert.equal(true, afterCalled);
                assert.equal(false, err);
                assert.equal(JSON.stringify({}), JSON.stringify(result));
                done();
            });

            trigger.execute();
        });

        it('should function normally if before, operation and after are not functions', function (done) {
            var trigger = new ModelTrigger(null, null, null, function () {
                done();
            });

            trigger.execute();
        });

        it('should not call operation and after if false is passed to the before callback', function (done) {
            var beforeCalled = false;
            var operationCalled = false;
            var afterCalled = false;

            var before = function (callback) {
                beforeCalled = true;
                callback(false);
            };

            var operation = function (callback) {
                operationCalled = true;
                callback(false, {});
            };

            var after = function (callback, err, result) {
                afterCalled = true;
                callback(err, result);
            };

            var trigger = new ModelTrigger(before, operation, after, function () {
                assert.equal(true, beforeCalled);
                assert.equal(false, operationCalled);
                assert.equal(false, afterCalled);
                done();
            });

            trigger.execute();
        });
    });
});