/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';
var assert = require('assert');
var DataSource = require('./../../src/Model/DataSource');

DataSource.prototype.info = function () { return; };
DataSource.prototype.debug = function () { return; };

describe('DataSource.js', function () {

    var mockCouchbase = function (connectionError) {
        return {
            'Connection' : function (connOptions, connectionCallback) {
                assert.equal(true, connOptions !== undefined);
                this.shutdown = function () { return; };
                setImmediate(function () {
                    connectionCallback(connectionError);
                });
            }
        };
    };

    var mockMySQL = function (connectionError) {
        return {
            'createConnection' : function () {
                return {
                    'connect' : function (callback) {
                        setImmediate(function () {
                            callback(connectionError);
                        });
                    },
                    'end' : function () { return; }
                };
            }
        };
    };

    var couchbaseConfigs = {
        //'index' : 'cep', if index is not passed, should assume default
        'host' : '127.0.0.1',
        'port' : '8091',
        'type' : 'Couchbase'
    };

    var mySQLConfigs = {
        'host' : '127.0.0.1',
        'port' : '3306',
        'type' : 'MySQL',
        'user' : 'root',
        'password' : ''
    };

    describe('DataSource', function () {

        it('should throw an IllegalArgument exception if one of the parameters is not a string', function () {
            try {
                var ds = new DataSource('default');
                assert(!ds);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('connect', function () {

        it('should throw an IllegalArgument exception if the parameters passed are not functions', function () {
            try {
                var ds = new DataSource('default', couchbaseConfigs);
                ds.connect(null, null);
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

        it('should call onSuccess if the connection already exists', function (done) {
            var ds = new DataSource('default', couchbaseConfigs);
            ds.connection = {};
            ds.connect(function () {
                done();
            }, function () {
                assert.fail();
            });
        });

        describe('MySQL', function () {

            it('should call MySQL connect if the type is MySQL', function (done) {
                var ds = new DataSource('default', mySQLConfigs);
                ds.mysql = mockMySQL();
                ds.connect(function () {
                    done();
                }, function (err) {
                    assert.fail(err);
                });
            });

            it('should call onError if MySQL connection function returns an error', function (done) {
                var ds = new DataSource('default', mySQLConfigs);
                var connectionError = { };
                ds.mysql = mockMySQL(connectionError);
                ds.connect(function () {
                    assert.fail();
                }, function () {
                    done();
                });
            });

        });

        describe('Couchbase', function () {

            it('should call couchbase connect if the type is Couchbase', function (done) {
                var ds = new DataSource('default', couchbaseConfigs);
                ds.couchbase = mockCouchbase();
                ds.connect(function () {
                    done();
                }, function (err) {
                    assert.fail(err);
                });
            });

            it('should call onError if Couchbase connect function returns an error', function (done) {
                var ds = new DataSource('default', couchbaseConfigs);
                var connectionError = { };
                ds.couchbase = mockCouchbase(connectionError);
                ds.connect(function () {
                    assert.fail();
                }, function () {
                    done();
                });
            });
        });

        it('should call onError if the connection type is invalid', function (done) {
            var ds = new DataSource('default', {
                'type' : 'invalid'
            });
            ds.connect(function () {
                assert.fail();
            }, function () {
                done();
            });
        });
    });

    describe('disconnect', function () {

        describe('Couchbase', function () {

            it('should call Couchbase disconnect if the type is Couchbase and there is an active connection', function (done) {

                var ds = new DataSource('default', couchbaseConfigs);
                ds.couchbase = mockCouchbase();
                ds.connect(function () {
                    ds.disconnect();
                    done();
                }, function () {
                    assert.fail();
                });

            });
        });

        describe('MySQL', function () {

            it('should call MySQL disconnect if the type is MySQL and there is an active connection', function (done) {

                var ds = new DataSource('default', mySQLConfigs);
                ds.couchbase = mockMySQL();
                ds.connect(function () {
                    ds.disconnect();
                    done();
                }, function () {
                    assert.fail();
                });

            });

        });

    });
});