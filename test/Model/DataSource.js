/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';
var expect = require('expect.js');
var DataSource = require('./../../src/Model/DataSource');

DataSource.prototype.info = function () { return; };
DataSource.prototype.debug = function () { return; };

describe('DataSource.js', function () {

    var mockCouchbase = function (connectionError) {
        return {
            'Connection' : function (connOptions, connectionCallback) {
                this.shutdown = function () { return; };
                setImmediate(function () {
                    connectionCallback(connectionError);
                });
            }
        };
    };

    var couchbaseConfigs = {
        //'index' : 'cep', if index is not passed, should assume default
        'host' : '127.0.0.1',
        'port' : '8091',
        'type' : 'Couchbase'
    };

    var logger = {
        'info' : function () { return; },
        'debug' : function () { return; }
    };

    describe('DataSource', function () {

        it('should throw an IllegalArgument exception if one of the parameters is not a string', function () {
            expect(function () {
                var ds = new DataSource(logger, 'default');
                expect(ds).not.to.be.ok();
            }).to.throwException(function (e) {
                expect(e.name).to.be('IllegalArgument');
            });
        });

    });

    describe('connect', function () {

        it('should throw an IllegalArgument exception if the parameters passed are not functions', function () {
            expect(function () {
                var ds = new DataSource(logger, 'default', couchbaseConfigs);
                ds.connect(null, null);
            }).to.throwException(function (e) {
                expect(e.name).to.be('IllegalArgument');
            });
        });

        it('should call onSuccess if the connection already exists', function (done) {
            var ds = new DataSource(logger, 'default', couchbaseConfigs);
            ds.connection = {};
            ds.connect(function () {
                done();
            }, function () {
                expect.fail();
            });
        });

        describe('Couchbase', function () {

            it('should call couchbase connect if the type is Couchbase', function (done) {
                var ds = new DataSource(logger, 'default', couchbaseConfigs);
                ds.couchbase = mockCouchbase();
                ds.connect(function () {
                    done();
                }, function (err) {
                    console.log(err);
                    expect.fail(err);
                });
            });

            it('should call onError if Couchbase connect function returns an error', function (done) {
                var ds = new DataSource(logger, 'default', couchbaseConfigs);
                var connectionError = { };
                ds.couchbase = mockCouchbase(connectionError);
                ds.connect(function () {
                    expect.fail();
                }, function () {
                    done();
                });
            });
        });

        it('should call onError if the connection type is invalid', function (done) {
            var ds = new DataSource(logger, 'default', {
                'type' : 'invalid'
            });
            ds.connect(function () {
                expect.fail();
            }, function () {
                done();
            });
        });
    });

    describe('disconnect', function () {

        describe('Couchbase', function () {

            it('should call Couchbase disconnect if the type is Couchbase and there is an active connection', function (done) {

                var ds = new DataSource(logger, 'default', couchbaseConfigs);
                ds.couchbase = mockCouchbase();
                ds.connect(function () {
                    ds.disconnect();
                    done();
                }, function () {
                    expect.fail();
                });

            });
        });

    });
});