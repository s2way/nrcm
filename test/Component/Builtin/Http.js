/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';
var Http = require('./../../../src/Component/Builtin/Http');
var expect = require('expect.js');

describe('Http.js', function () {

    var instance, blankFunction;

    blankFunction = function () { return; };

    function mockHttp(options) {
        var callCallback, onData, onRequestMethod, onResponseMethod, requestFunction;

        callCallback = function (callback) {
            setImmediate(callback);
        };
        onData = function (callback) {
            setImmediate(function () {
                callback('');
            });
        };
        onRequestMethod = function (event, callback) {
            if (event === 'error') {
                options.request.onError(callback);
            } else if (event === 'data') {
                options.request.onData(callback);
            } else if (event === 'end') {
                options.request.onEnd(callback);
            }
        };
        onResponseMethod = function (event, callback) {
            if (event === 'error') {
                options.response.onError(callback);
            } else if (event === 'data') {
                options.response.onData(callback);
            } else if (event === 'end') {
                options.response.onEnd(callback);
            }
        };

        requestFunction = function (requestOptions, requestCallback) {
            setImmediate(function () {
                requestCallback({
                    'on' : onResponseMethod,
                    'statusCode' : options.response.statusCode,
                    'headers' : options.response.headers
                });
            });
            return {
                'setHeader' : options.request.setHeader,
                'on' : onRequestMethod,
                'end' : blankFunction,
                'write' : blankFunction
            };
        };

        options = options || {};
        options.response = options.response || {};
        options.response.statusCode = options.response.statusCode || 200;
        options.response.headers = options.response.headers || {};
        options.response.onError = options.response.onError || blankFunction;
        options.response.onData = options.response.onData || onData;
        options.response.onEnd = options.response.onEnd || callCallback;
        options.request = options.request || {};
        options.request.onError = options.request.onError || blankFunction;
        options.request.onData = options.request.onData || onData;
        options.request.onEnd = options.request.onEnd || callCallback;
        options.request.setHeader = options.request.setHeader || blankFunction;
        options.requestFunction = options.requestFunction || requestFunction;

        return {
            'request' : options.requestFunction
        };
    }

    beforeEach(function () {
        instance = new Http();
        instance._http = mockHttp();
    });

    describe('get', function () {

        it('should perform a get operation', function (done) {
            instance.get('/', function (error, response) {
                expect(response).to.be.ok();
                done();
            });
        });

    });

    describe('delete', function () {

        it('should perform a delete operation', function (done) {
            instance.delete('/', function (error, response) {
                expect(response).to.be.ok();
                done();
            });
        });

    });

    describe('post', function () {

        it('should perform a post operation', function (done) {
            instance.post('/', {}, function (error, response) {
                expect(response).to.be.ok();
                done();
            });
        });

        it('should convert the JSON payload to an url encoded string if the content type is x-www-form-urlencoded payload', function (done) {
            instance = new Http({
                'contentType' : 'application/x-www-form-urlencoded'
            });
            instance._http = mockHttp({
                'requestFunction' : function () {
                    return {
                        'setHeader' : blankFunction,
                        'end' : blankFunction,
                        'on' : blankFunction,
                        'write' : function (payload) {
                            expect(payload).to.be('this%20is%20a%20bad%20key=this%20is%20a%20bad%20value');
                            done();
                        }
                    };
                }
            });
            instance.post('/', {
                'this is a bad key' : 'this is a bad value'
            }, blankFunction);
        });

        it('should convert the url encoded response to a JSON if the response content type is x-www-form-urlencoded payload', function (done) {
            instance = new Http({
                'contentType' : 'application/json' // Body is JSON, response is x-www-form-urlencoded
            });
            instance._http = mockHttp({
                'response' : {
                    'onData' : function (callback) {
                        callback('this%20is%20a%20bad%20key=this%20is%20a%20bad%20value');
                    },
                    'headers' : {
                        'Content-Type' : 'application/x-www-form-urlencoded'
                    }
                }
            });
            instance.post('/', {}, function (error, response) {
                expect(error).not.to.be.ok();
                expect(response.body['this is a bad key']).to.be('this is a bad value');
                done();
            });
        });


    });

    describe('put', function () {

        it('should perform a put operation', function (done) {
            instance.put('/', {}, function (error, response) {
                expect(response).to.be.ok();
                done();
            });
        });

    });

    describe('setHeaders', function () {

        it('should set the headers', function () {
            var headers;
            headers = { 'X-Something' : 'X-Value' };
            instance.setHeaders(headers);
            expect(instance._headers).to.be(headers);
        });
    });

    describe('request', function () {

        it('should return a response object containing the status code', function (done) {
            instance.request({
                'method' : 'get',
                'resource' : '/'
            }, function (error, response) {
                expect(error).not.to.be.ok();
                expect(response.statusCode).to.be(200);
                done();
            });
        });

        it('should return a response object containing the response headers', function (done) {
            instance.request({
                'method' : 'get',
                'resource' : '/'
            }, function (error, response) {
                expect(response.headers).to.be.ok();
                done();
            });
        });

        it('should call the callback passing the error object if something wrong occurs', function (done) {

            var errorObject = {};
            instance._http = mockHttp({
                'response' : {
                    'onEnd' : blankFunction
                },
                'request' : {
                    'onData' : blankFunction,
                    'onEnd' : blankFunction,
                    'onError' : function (callback) {
                        callback(errorObject);
                    }
                }
            });
            instance.request({
                'method' : 'get',
                'resource' : '/'
            }, function (error, response) {
                expect(error).to.be(errorObject);
                expect(response).not.to.be.ok();
                done();
            });

        });

        it('should return a response object containing the response body', function (done) {
            instance._http = mockHttp({
                'response' : {
                    'onData' : function (callback) {
                        callback('{}');
                    }
                }
            });
            instance.request({
                'method' : 'get',
                'resource' : '/'
            }, function (error, response) {
                expect(JSON.stringify(response.body)).to.be('{}');
                done();
            });
        });

    });

});