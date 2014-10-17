/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var exceptions = require("./../src/exceptions");
var assert = require("assert");

describe('exceptions.js', function () {

    var exceptionClass, message, exceptionInstance;

    function itShouldContainTheNameOfTheClass() {
        exceptionInstance = new exceptions[exceptionClass](message);
        assert.equal(exceptionClass, exceptionInstance.name);
    }

    function itShouldContainTheExceptionMessage() {
        exceptionInstance = new exceptions[exceptionClass](message);
        assert.equal(message, exceptionInstance.message);
    }

    function describeName() {
        it('should contain the name of the class', itShouldContainTheNameOfTheClass);
    }

    function describeMessage() {
        it('should contain the exception message', itShouldContainTheExceptionMessage);
    }

    function describeExceptionClass() {
        message = 'exception message';
        describe('.name', describeName);
        describe('.message', describeMessage);
    }

    for (exceptionClass in exceptions) {
        if (exceptions.hasOwnProperty(exceptionClass)) {
            describe(exceptionClass, describeExceptionClass);
        }
    }
});