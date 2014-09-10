/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';

var Couchbase = require('./../../../../src/Component/Builtin/DataSource/Couchbase');
var expect = require('expect.js');

describe('Couchbase.js', function () {

    var instance;

    beforeEach(function () {
        instance = new Couchbase('default');
        instance.logger = {
            'info': function () {
                return;
            }
        };
        instance._couchbase = {
            'Connection' : function (options, callback) {
                setImmediate(function () {
                    callback(null);
                });
            }
        };
        instance.core = {
            'dataSources': {
                'default': {
                    'host': 'localhost',
                    'port' : 9000
                }
            }
        };
    });

    describe('init', function () {
        it('should throw an IllegalArgument exception if the data source cannot be found', function () {
            instance = new Couchbase('invalid');
            instance.core = { 'dataSources' : { } };
            expect(function () {
                instance.init();
            }).to.throwException(function (e) {
                expect(e.name).to.be('IllegalArgument');
            });
        });
    });

    describe('destroy', function () {

        it('should call the couchbase shutdown() method', function (done) {
            instance = new Couchbase('default');
            instance.logger = {
                'info': function () {
                    return;
                }
            };
            instance._couchbase = {
                'Connection' : function (options, callback) {
                    setImmediate(function () {
                        callback(null);
                    });
                    this.shutdown = function () {
                        done();
                    };
                }
            };
            instance.core = {
                'dataSources': {
                    'default': {
                        'host': 'localhost',
                        'port' : 9000
                    }
                }
            };
            instance.connect(function () {
                instance.destroy();
            });
        });

    });

    describe('connect', function () {
        it('should pass the error to the callback if one occurs', function (done) {
            var error = { };
            instance = new Couchbase();
            instance.logger = {
                'info': function () {
                    return;
                }
            };
            instance._couchbase = {
                'Connection' : function (options, callback) {
                    setImmediate(function () {
                        callback(error);
                    });
                }
            };
            instance.connect(function (err) {
                expect(err).to.be.equal(error);
                done();
            });
        });

        it('should return the couchbase connection object', function (done) {
            instance.connect(function (error, connection) {
                expect(error).not.to.be.ok();
                expect(connection).to.be.ok();
                done();
            });
        });

        it('should return exactly the same connection if the method is called twice', function (done) {
            instance.connect(function (error, connection) {
                instance.connect(function (error2, connection2) {
                    expect(error).not.to.be.ok();
                    expect(error2).not.to.be.ok();
                    expect(connection).to.be.equal(connection2);
                    done();
                });
            });
        });
    });

});