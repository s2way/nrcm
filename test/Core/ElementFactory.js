/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var expect = require('expect.js');
var ElementFactory = require('../../src/Core/ElementFactory');

describe('ElementFactory.js', function () {

    var factory, componentInstance, modelInstance, blankFunction, logger;
    blankFunction = function () { return; };
    logger = { 'log' : blankFunction };

    beforeEach(function () {
        factory = new ElementFactory(logger, {
            'components' : {
                'MyComponent' : blankFunction
            },
            'models' : {
                'MyModel' : blankFunction
            },
            'configs' : { },
            'core' : { },
            'logger' : logger,
            'constants' : { }
        });
        componentInstance = factory.create('component', 'MyComponent');
        modelInstance = factory.create('model', 'MyModel');
    });

    describe('init', function () {

        it('should call the init method if defined', function (done) {
            factory = new ElementFactory(logger, {
                'components' : {
                    'MyComponent' : function () {
                        this.init = function () {
                            done();
                        };
                        return;
                    }
                },
                'logger' : logger,
                'constants' : { }
            });
            componentInstance = factory.create('component', 'MyComponent');
            factory.init(componentInstance);
        });

    });

    describe('create', function () {

        describe('model', function () {

            it('should not return the same instance if called twice', function () {
                expect(modelInstance).not.to.be.equal(factory.create('model', 'MyModel'));
            });

            it('should create the model and inject the name property', function () {
                expect(modelInstance.name).to.be('MyModel');
            });

            it('should create the model and inject the configs property', function () {
                expect(modelInstance.configs).to.an('object');
            });

            it('should inject the application constants', function () {
                expect(modelInstance.constants).to.be.ok();
            });

            it('should inject the method for retrieving components', function () {
                expect(modelInstance.component('InvalidComponent')).to.be(null);
            });

            it('should inject the method for retrieving models', function () {
                var myModel = modelInstance.model('MyModel');
                expect(myModel.name).to.be('MyModel');
                expect(modelInstance.model('InvalidModel')).to.be(null);
            });

            it('should inject the method for retrieving models inside the models retrieved by the model method', function () {
                expect(modelInstance.model('MyModel').model('MyModel').name).to.be('MyModel');
            });

        });

        describe('component', function () {

            it('should pass the params to the component constructor', function (done) {
                factory = new ElementFactory(logger, {
                    'components' : {
                        'MyComponent' : function (params) {
                            expect(params.key).to.be('value');
                            done();
                        }
                    },
                    'core' : { },
                    'logger' : logger,
                    'constants' : { }
                });
                componentInstance = factory.create('component', 'MyComponent', {
                    'key' : 'value'
                });
            });

            it('should not return the same component componentInstance if called twice', function () {
                var anotherInstance = factory.create('component', 'MyComponent');
                expect(componentInstance).not.to.be.equal(anotherInstance);
            });

            it('should create the component and inject the name property', function () {
                expect(componentInstance.name).to.be('MyComponent');
            });

            it('should inject the application constants', function () {
                expect(componentInstance.constants).to.be.ok();
            });

            it('should create the model and inject the application core object (configurations)', function () {
                expect(componentInstance.core).to.be.an('object');
            });

            it('should create the model and inject the application configs object (all configuration files)', function () {
                expect(componentInstance.configs).to.be.an('object');
            });

            it('should inject the method for retrieving components', function () {
                expect(componentInstance.component('InvalidComponent')).to.be(null);
            });

            it('should inject the method for retrieving components inside the components retrieved by the component method', function () {
                expect(componentInstance.component('MyComponent').component('MyComponent').name).to.be('MyComponent');
            });

            it('should inject the method for retrieving models', function () {
                expect(componentInstance.model('InvalidModel')).to.be(null);
            });

            it('should always return the same componentInstance if the component is marked as singleInstance', function () {
                factory = new ElementFactory(logger, {
                    'components' : {
                        'MyComponent' : function () {
                            this.singleInstance = true;
                        }
                    },
                    'core' : { },
                    'logger' : logger
                });
                componentInstance = factory.create('component', 'MyComponent');
                expect(factory.create('component', 'MyComponent')).to.be(componentInstance);
                expect(factory.getComponents()).to.have.length(1);
                expect(factory.getComponents()).to.contain(componentInstance);
            });

            it('should always return a different componentInstance if the component is not marked as singleInstance', function () {
                factory = new ElementFactory(logger, {
                    'components' : {
                        'MyComponent' : function () {
                            return;
                        }
                    },
                    'core' : { },
                    'logger' : logger
                });
                componentInstance = factory.create('component', 'MyComponent');
                var componentInstance2 = factory.create('component', 'MyComponent');
                expect(componentInstance2).not.to.be(componentInstance);
                expect(factory.getComponents()).to.have.length(2);
                expect(factory.getComponents()).to.contain(componentInstance);
                expect(factory.getComponents()).to.contain(componentInstance2);
            });
        });

    });

});