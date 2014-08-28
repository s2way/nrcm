/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var expect = require('expect.js');
var ComponentFactory = require('../../src/Component/ComponentFactory');

ComponentFactory.prototype.info = function () { return; };

describe('ComponentFactory.js', function () {

    describe('create', function () {

        var factory, instance;

        it('should pass the params to the component constructor', function (done) {
            factory = new ComponentFactory({
                'info' : function () { return; },
                'debug' : function () { return; }
            }, {
                'components' : {
                    'MyComponent' : function (params) {
                        expect(params.key).to.be('value');
                        done();
                        return;
                    }
                },
                'logger' : { }
            });
            instance = factory.create('MyComponent', {
                'key' : 'value'
            });
        });

        beforeEach(function () {
            factory = new ComponentFactory({
                'info' : function () { return; },
                'debug' : function () { return; }
            }, {
                'components' : {
                    'MyComponent' : function () {
                        return;
                    }
                },
                'logger' : { }
            });
            instance = factory.create('MyComponent');
        });

        it('should not return the same component instance if called twice', function () {
            var anotherInstance = factory.create('MyComponent');
            expect(instance).not.to.be.equal(anotherInstance);
        });

        it('should create the component and inject the name property', function () {
            expect(instance.name).to.be('MyComponent');
        });

        it('should create the model and inject the application logger object', function () {
            expect(instance.logger).to.be.an('object');
        });

        it('should inject the method for retrieving components', function () {
            expect(instance.component('InvalidComponent')).to.be(null);
        });

        it('should inject the method for retrieving components inside the components retrieved by the component method', function () {
            expect(instance.component('MyComponent').component('MyComponent').name).to.be('MyComponent');
        });

    });

});