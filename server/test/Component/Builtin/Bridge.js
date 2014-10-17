/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach, afterEach */
'use strict';
var Bridge = require('./../../../src/Component/Builtin/Bridge');
var expect = require('expect.js');

describe('Bridge.js', function () {

    var instance, blankFunction;

    blankFunction = function () { return; };

    beforeEach(function () {
        instance = new Bridge('wallet');
        instance.core = {
            'bridges' : {
                'wallet' : {
                    'app' : 'wallet',
                    'host' : 'localhost',
                    'port' : '8001'
                }
            }
        };
    });

    describe('init', function () {

        it('should throw an IllegalArgument exception if the bridge cannot be found', function () {
            expect(function () {
                instance = new Bridge('invalid');
                instance.core = { 'bridges' : { } };
                instance.init();
            }).to.throwException(function (e) {
                expect(e.name).to.be('IllegalArgument');
            });
        });

    });

    describe('put, get, delete, post', function () {

        var methods = ['put', 'get', 'delete', 'post'];

        methods.forEach(function (method) {
            it('should call Http.' + method + '() method passing the correct parameters', function (done) {
                var payment = { }, query = { }, headers = { };
                instance.component = function () {
                    var object = { };
                    object[method] = function (resource, options, callback) {
                        expect(resource).to.be('/wallet/payment');
                        expect(options.payload).to.be(payment);
                        expect(options.headers).to.be(headers);
                        expect(options.query).to.be(query);
                        expect(callback).to.be.a('function');
                        done();
                    };
                    return object;
                };
                instance.init();
                instance[method]('payment', {
                    'payload' : payment,
                    'headers' : headers,
                    'query' : query
                }, blankFunction);
            });
        });

    });

});