/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
var assert = require('assert');
var DataSource = require('./../../src/Model/DataSource');

var controlVars = { };

describe('DataSource.js', function () {
    function mockCouchbase() {
        return {
            'Connection' : function (connOptions, connectionCallback) {
                assert.equal(true, connOptions !== undefined);
                this.shutdown = function () {
                    controlVars.shutdown = true;
                };
                setTimeout(function () {
                    connectionCallback();
                }, 10);
            }
        };
    }

    function createDataSource(name, configs) {
        var ds = new DataSource(name, configs);
        ds.log = function (msg) {
            this.msg = msg; // JSLint empty block
        };
        return ds;
    }

    var configs = {
        'index' : 'cep',
        'host' : '127.0.0.1',
        'port' : '8091',
        'type' : 'Couchbase'
    };

    describe('DataSource', function () {

        it('should throw an IllegalArgument exception if one of the parameters is not a string', function () {
            try {
                createDataSource('default');
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('connect', function () {

        it('should throw an IllegalArgument exception if the parameters passed are not functions', function () {
            try {
                var ds = createDataSource('default', configs);
                ds.connect(null, null);
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

        it('should call onSuccess if the connection already exists', function (done) {
            var ds = createDataSource('default', configs);
            ds.connection = {};
            ds.connect(function () {
                done();
            }, function () {
                assert.fail();
            });
        });

        it('should call couchbase connect if the type is Couchbase', function (done) {
            var ds = createDataSource('default', configs);
            ds.couchbase = mockCouchbase();

            ds.connect(function () {
                done();
            }, function (err) {
                assert.fail(err);
            });
        });

        it('should call onError if Couchbase connect function returns an error', function (done) {
            var ds = createDataSource('default', configs);
            ds.type = 'Invalid';
            ds.connect(function () {
                assert.fail();
            }, function () {
                done();
            });
        });

        it('should call onError if the connection type is invalid', function (done) {
            var ds = createDataSource('default', configs);
            ds.couchbase = {
                'Connection' : function (connOptions, connectionCallback) {
                    assert.equal(true, connOptions !== undefined);
                    this.shutdown = function () {
                        controlVars.shutdown = true;
                    };
                    setTimeout(function () {
                        connectionCallback({'error' : 'error'});
                    }, 10);
                }
            };
            ds.connect(function () {
                assert.fail();
            }, function () {
                done();
            });
        });
    });

    describe('disconnect', function () {

        it('should call Couchbase disconnect if the type is Couchbase and there is an active connection', function (done) {

            var ds = createDataSource('default', configs);
            ds.couchbase = mockCouchbase();
            ds.connect(function () {
                ds.disconnect();
                assert.equal(true, controlVars.shutdown);
                done();
            }, function () {
                assert.fail();
            });

        });

    });
});