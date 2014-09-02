/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var expect = require('expect.js');
var ModelFactory = require('../../src/Model/ModelFactory');

describe('ModelFactory.js', function () {

    var instance, factory;
    var application;

    beforeEach(function () {
        application = {
            'models' : {
                'MyModel' : function () {
                    this.type = 'index';
                    return;
                }
            },
            'components' : {
                'MyComponent' : function () {
                    return;
                }
            },
            'logger' : { }
        };
        var componentFactory = {
            'create' : function () {
                return null;
            }
        };
        var logger = {
            'debug' : function () { return; },
            'info' : function () { return; }
        };
        factory = new ModelFactory(logger, application, componentFactory);
        instance = factory.create('MyModel');
    });

    describe('init', function () {
        it('should call the init method if defined', function (done) {
            application.models.MyModel = function () {
                this.type = 'index';
                this.init = function () {
                    done();
                };
            };
            instance = factory.create('MyModel');
            factory.init(instance);
        });
    });

    describe('create', function () {

        it('should not return the same instance if called twice', function () {
            expect(instance).not.to.be.equal(factory.create('MyModel'));
        });

        it('should create the model and inject the name property', function () {
            assert.equal('MyModel', instance.name);
        });

        it('should create the model and inject the application logger object', function () {
            assert.equal('object', typeof instance.logger);
        });

        it('should inject the method for retrieving components', function () {
            assert.equal(null, instance.component('InvalidComponent'));
        });

        it('should inject the method for retrieving models', function () {
            var myModel = instance.model('MyModel');
            assert.equal('MyModel', myModel.name);
            assert.equal(null, instance.model('InvalidModel'));
        });

        it('should inject the method for retrieving models inside the models retrieved by the model method', function () {
            assert.equal('MyModel', instance.model('MyModel').model('MyModel').name);
        });

    });

});