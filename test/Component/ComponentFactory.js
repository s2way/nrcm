/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var expect = require('expect.js');
var ComponentFactory = require('../../src/Component/ComponentFactory');


describe('ComponentFactory.js', function () {

    var factory, instance;
    var blankFunction = function () { return; };

    ComponentFactory.prototype.info = blankFunction;

    beforeEach(function () {
        factory = new ComponentFactory({
            'info' : blankFunction,
            'debug' : blankFunction
        }, {
            'components' : {
                'MyComponent' : blankFunction
            },
            'core' : { },
            'logger' : { },
            'constants' : { }
        });
        instance = factory.create('MyComponent');
    });


    describe('init', function () {

        it('should call the init method if defined', function (done) {
            factory = new ComponentFactory({
                'info' : blankFunction,
                'debug' : blankFunction
            }, {
                'components' : {
                    'MyComponent' : function () {
                        this.init = function () {
                            done();
                        };
                        return;
                    }
                },
                'logger' : { },
                'constants' : { }
            });
            instance = factory.create('MyComponent');
            factory.init(instance);
        });

    });

    describe('create', function () {

        it('should pass the params to the component constructor', function (done) {
            factory = new ComponentFactory({
                'info' : blankFunction,
                'debug' : blankFunction
            }, {
                'components' : {
                    'MyComponent' : function (params) {
                        expect(params.key).to.be('value');
                        done();
                        return;
                    }
                },
                'core' : { },
                'logger' : { },
                'constants' : { }
            });
            instance = factory.create('MyComponent', {
                'key' : 'value'
            });
        });

        it('should not return the same component instance if called twice', function () {
            var anotherInstance = factory.create('MyComponent');
            expect(instance).not.to.be.equal(anotherInstance);
        });

        it('should create the component and inject the name property', function () {
            expect(instance.name).to.be('MyComponent');
        });

        it('should inject the application constants', function () {
            expect(instance.constants).to.be.ok();
        });

        it('should create the model and inject the application core object (configurations)', function () {
            expect(instance.core).to.be.an('object');
        });

        it('should inject the method for retrieving components', function () {
            expect(instance.component('InvalidComponent')).to.be(null);
        });

        it('should inject the method for retrieving components inside the components retrieved by the component method', function () {
            expect(instance.component('MyComponent').component('MyComponent').name).to.be('MyComponent');
        });

        it('should always return the same instance if the component is marked as singleInstance', function () {
            factory = new ComponentFactory({
                'info' : blankFunction,
                'debug' : blankFunction
            }, {
                'components' : {
                    'MyComponent' : function () {
                        this.singleInstance = true;
                    }
                },
                'core' : { },
                'logger' : { }
            });
            instance = factory.create('MyComponent');
            expect(factory.create('MyComponent')).to.be(instance);
            expect(factory.getComponents()).to.have.length(1);
            expect(factory.getComponents()).to.contain(instance);
        });

        it('should always return a different instance if the component is not marked as singleInstance', function () {
            factory = new ComponentFactory({
                'info' : blankFunction,
                'debug' : blankFunction
            }, {
                'components' : {
                    'MyComponent' : function () {
                        return;
                    }
                },
                'core' : { },
                'logger' : { }
            });
            instance = factory.create('MyComponent');
            var instance2 = factory.create('MyComponent');
            expect(instance2).not.to.be(instance);
            expect(factory.getComponents()).to.have.length(2);
            expect(factory.getComponents()).to.contain(instance);
            expect(factory.getComponents()).to.contain(instance2);
        });

    });

});