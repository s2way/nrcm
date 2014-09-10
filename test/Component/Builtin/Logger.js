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
            expect(instance.fileName).to.be('default.log');
        });

    });

    describe('info', function () {
        it('should call the logger info method', function (done) {
            instance._logger.info = function () {
                done();
            };
            instance.info('!');
        });
    });
    describe('debug', function () {
        it('should call the logger debug method', function (done) {
            instance._logger.debug = function () {
                done();
            };
            instance.debug('!');
        });
    });
    describe('message', function () {
        it('should call the logger info method', function (done) {
            instance._logger.info = function () {
                done();
            };
            instance.message('!');
        });
    });
    describe('error', function () {
        it('should call the logger error method', function (done) {
            instance._logger.error = function () {
                done();
            };
            instance.error('!');
        });
    });
    describe('warn', function () {
        it('should call the logger warn method', function (done) {
            instance._logger.warn = function () {
                done();
            };
            instance.warn('!');
        });
    });

});