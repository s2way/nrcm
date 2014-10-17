/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach, afterEach */
'use strict';
var Logger = require('./../../../src/Component/Builtin/Logger');
var expect = require('expect.js');
var fs = require('fs');

describe('Logger.js', function () {

    var instance;

    beforeEach(function () {
        instance = new Logger();
        instance.constants = {
            'logsPath' : '.'
        };
        instance.init();
    });

    describe('Logger()', function () {

        it('should use the default.log file name if none is specified', function () {
            expect(instance._fileName).to.be('default.log');
        });

    });

    describe('enable', function () {

        it('should enable logging if disable() was called before and info() should call print()', function (done) {
            instance.disable();
            instance.enable();
            instance._print = function () {
                done();
            };
            instance.info('!');
        });

    });

    describe('disable', function () {

        it('should disable logging and info() should not call print()', function () {
            instance.disable();
            instance._print = function () {
                expect().fail();
            };
            instance.info('!');
        });

    });

    describe('info', function () {
        it('should call the logger info method', function (done) {
            instance._print = function () {
                done();
            };
            instance.info('!');
        });
    });

});