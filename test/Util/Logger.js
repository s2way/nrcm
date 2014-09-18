/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';
var expect = require('expect.js');
var Logger = require('./../../src/Util/Logger');

describe('Logger.js', function () {

    var instance, message = '!';

    beforeEach(function () {
        instance = new Logger('.');
    });

    describe('info', function () {
        it('should call the logger.info() method', function (done) {
            instance._logger = {
                'info' : function (msg) {
                    expect(msg).to.be(message);
                    done();
                }
            };
            instance.info(message);
        });
    });

    describe('debug', function () {
        it('should call the logger.debug() method', function (done) {
            instance._logger = {
                'debug' : function (msg) {
                    expect(msg).to.be(message);
                    done();
                }
            };
            instance.debug(message);
        });
    });


    describe('error', function () {
        it('should call the logger.error() method', function (done) {
            instance._logger = {
                'error' : function (msg) {
                    expect(msg).to.be(message);
                    done();
                }
            };
            instance.error(message);
        });
    });

    describe('warn', function () {
        it('should call the logger.warn() method', function (done) {
            instance._logger = {
                'warn' : function (msg) {
                    expect(msg).to.be(message);
                    done();
                }
            };
            instance.warn(message);
        });
    });


});