/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var Exceptions = require('./../../src/Controller/Exceptions');

var instance = new Exceptions();

describe('Exceptions.js', function () {
    describe('onControllerNotFound', function () {
        it('should return a JSON object', function () {
            instance.onControllerNotFound(function () { return; });
        });
    });

    describe('onApplicationNotFound', function () {
        it('should return a JSON object', function () {
            instance.onApplicationNotFound(function () { return; });
        });
    });

    describe('onMethodNotFound', function () {
        it('should return a JSON object', function () {
            instance.onMethodNotFound(function () { return; });
        });
    });

    describe('onForbidden', function () {
        it('should return a JSON object', function () {
            instance.onForbidden(function () { return; });
        });
    });

    describe('onGeneral', function () {
        it('should return a JSON object', function () {
            instance.onGeneral(function () { return; }, { });
        });
    });

    describe('onTimeout', function () {
        it('should return a JSON object', function () {
            instance.onTimeout(function () { return; }, { });
        });
    });
});
