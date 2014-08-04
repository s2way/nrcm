/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var ComponentFactory = require('../../src/Component/ComponentFactory');

ComponentFactory.prototype.info = function () { return; };

describe('ComponentFactory.js', function () {

    describe('create', function () {

        var instance;

        beforeEach(function () {
            var factory = new ComponentFactory({
                'info' : function () { return; },
                'debug' : function () { return; }
            }, {
                'components' : {
                    'MyComponent' : function () {
                        return;
                    }
                }
            });
            instance = factory.create('MyComponent');
        });

        it('should create the component and inject the name property', function () {
            assert.equal('MyComponent', instance.name);
        });

        it('should inject the method for retrieving components', function () {
            assert.equal(null, instance.component('InvalidComponent'));
        });

        it('should inject the method for retrieving components inside the components retrieved by the component method', function () {
            // Retrieving itself
            assert.equal('MyComponent', instance.component('MyComponent').component('MyComponent').name);
        });

    });

});