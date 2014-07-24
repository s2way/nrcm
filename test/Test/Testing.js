/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var Testing = require('../../src/Test/Testing');

describe('Testing', function () {

    var testing = null;
    var payload = {
        'this' : 'is',
        'a' : 'payload'
    };
    var query = {
        'this' : 'is',
        'a' : 'query string'
    };

    beforeEach(function () {
        testing = new Testing('app', {
            'default' : {
                'type' : 'Mock',
                'host' : '0.0.0.0',
                'port' : '8091',
                'index' : 'index'
            }
        });
    });

    describe('loadModel', function () {
        it('should return the model constructor', function () {
            testing._require = function (path) {
                assert.equal('app/src/Model/MyModel', path);
                return function () {
                    return;
                };
            };
            testing.loadModel('MyModel');
        });
    });

    describe('loadComponent', function () {
        it('should return the model component', function () {
            testing._require = function (path) {
                assert.equal('app/src/Component/MyComponent', path);
            };
            testing.loadComponent('MyComponent');
        });
    });

    describe('createComponent', function () {
        beforeEach(function () {
            testing._require = function () {
                return function () {
                    return;
                };
            };
        });
        it('should call ComponentFactory.create()', function (done) {
            testing.componentFactory.create = function (componentName) {
                assert.equal('MyComponent', componentName);
                done();
            };
            testing.createComponent('MyComponent');
        });

        it('should load the component before creating it', function (done) {
            testing.loadComponent = function (componentName) {
                assert.equal('MyComponent', componentName);
                done();
            };
            testing.componentFactory.create = function (componentName) {
                assert.equal('MyComponent', componentName);
            };
            testing.createComponent('MyComponent');
        });
    });

    describe('createModel', function () {
        beforeEach(function () {
            testing._require = function () {
                return function () {
                    return;
                };
            };
        });
        it('should call ModelFactory.create()', function (done) {
            testing.modelFactory.create = function (modelName) {
                assert.equal('MyModel', modelName);
                done();
            };
            testing.createModel('MyModel');
        });

        it('should load the model before creating it', function (done) {
            testing.loadModel = function (modelName) {
                assert.equal('MyModel', modelName);
                done();
            };

            testing.modelFactory.create = function (modelName) {
                assert.equal('MyModel', modelName);
            };
            testing.createModel('MyModel');
        });
    });

    describe('callController', function () {

        beforeEach(function () {
            testing._require = function (path) {
                if (path === 'app/src/Controller/MyController') {
                    // Controller constructor
                    return function () {
                        this.post = function (callback) {
                            callback({
                                'payload' : this.payload,
                                'query' : this.query
                            });
                        };
                        this.put = function (callback) {
                            var model = this.model('MyModel');
                            model.myModelMethod(callback);
                        };
                    };
                }
                if (path === 'app/src/Model/MyModel') {
                    // Model constructor
                    return function () {
                        this.myModelMethod = function (callback) {
                            this._find({ }, function () {
                                callback({ });
                            });
                        };
                    };
                }
                return null;
            };
        });

        it('should call the controller method', function (done) {

            testing.callController('MyController', 'post', {
                'payload' : payload,
                'query' : query
            }, function (response) {
                assert.equal(JSON.stringify(payload), JSON.stringify(response.payload));
                assert.equal(JSON.stringify(query), JSON.stringify(response.query));
                done();
            });

        });

        it('should pass the status code, headers and content type to the callback function', function (done) {
            testing.callController('MyController', 'post', { }, function (response, info) {
                assert(response);
                assert.equal(200, info.statusCode);
                assert.equal('application/json', info.contentType);
                assert.equal('object', typeof info.headers);
                done();
            });

        });

        it('should load the model with a Mock DataSource if loadModel is called before callController', function (done) {
            testing.loadModel('MyModel');
            testing.callController('MyController', 'put', { }, function () {
                done();
            });
        });

        it('should access the payload as an empty string if it is not passed', function (done) {

            testing.callController('MyController', 'post', { }, function (response) {
                assert.equal(JSON.stringify({}), JSON.stringify(response.payload));
                done();
            });

        });
    });

});