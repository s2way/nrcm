/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';

var Couchbase = require('./../../../../src/Component/Builtin/DataSource/Couchbase');
var expect = require('expect.js');

describe('Couchbase.js', function () {

    var instance, core, logger;
    core = {
        'dataSources': {
            'default': {
                'host': 'localhost',
                'port' : 9000
            }
        }
    };
    logger = {
        'info': function () {
            return;
        }
    };

    beforeEach(function () {
        instance = new Couchbase('default');
        instance.logger = logger;
        instance.core = core;
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

    describe('connect', function () {
        it('should return the bucket object', function (done) {
            var bucket = {
                'on' : function (what, callback) {
                    if (what === 'connect') {
                        callback(null, bucket);
                    }
                }
            };
            instance = new Couchbase();
            instance.core = core;
            instance.logger = logger;
            instance.init();
            instance._couchbase = {
                'Cluster' : function () {
                    return {
                        'openBucket' : function () {
                            return bucket;
                        }
                    };
                }
            };
            instance.connect(function (error, b) {
                expect(b).to.be(bucket);
                done();
            });
        });

    });

    it('should pass an error to the callback if an error occurs', function (done) {
        var bucket = {
            'on' : function (what, callback) {
                if (what === 'error') {
                    callback({});
                }
            }
        };
        instance = new Couchbase();
        instance.core = core;
        instance.logger = logger;
        instance.init();
        instance._couchbase = {
            'Cluster' : function () {
                return {
                    'openBucket' : function () {
                        return bucket;
                    }
                };
            }
        };
        instance.connect(function (error) {
            expect(error).to.ok();
            done();
        });
    });

});
