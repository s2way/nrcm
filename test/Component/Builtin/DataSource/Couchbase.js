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

    describe('connect', function () {
        it('should return the bucket object', function (done) {
            var bucket = { };
            instance = new Couchbase();
            instance.core = {
                'dataSources' : {
                    'default' : {
                        'host' : 'localhost',
                        'port' : 9000
                    }
                }
            };
            instance.logger = {
                'info': function () {
                    return;
                }
            };
            instance.init();
            instance._couchbase = {
                'Cluster' : function () {
                    return {
                        'openBucket' : function (bucketName, callback) {
                            setImmediate(function () {
                                callback(null, bucket);
                            });
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

});
