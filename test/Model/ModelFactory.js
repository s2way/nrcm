/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var ModelFactory = require('../../src/Model/ModelFactory');

describe('ModelFactory.js', function () {

    describe('load', function () {

        var instance;

        beforeEach(function () {
            var loader = new ModelFactory({
                'models' : {
                    'MyModel' : function () {
                        return;
                    }
                },
                'components' : {
                    'MyComponent' : function () {
                        return;
                    }
                }
            }, {
                'default' : {
                    'type' : 'Mock'
                }
            }, {
                'create' : function () {
                    return null;
                }
            });
            instance = loader.create('MyModel');
        });

        it('should load the model and inject the name property', function () {
            assert.equal('MyModel', instance.name);
        });

        it('should inject the method for retrieving components', function () {
            assert.equal(null, instance.component('InvalidComponent'));
        });

        it('should inject the method for retrieving models', function () {
            var myModel = instance.model('MyModel');
            // Just to be sure that this model really is MyModel
            assert.equal('MyModel', myModel.name);
            assert.equal(null, instance.model('InvalidModel'));
        });

        it('should inject all ModelInterface methods inside the models retrieved by the model method', function () {
            var myModel = instance.model('MyModel');

            assert.equal('function', typeof myModel._findAll);
            assert.equal('function', typeof myModel._findByKey);
            assert.equal('function', typeof myModel._findById);
            assert.equal('function', typeof myModel._find);
            assert.equal('function', typeof myModel._removeById);
            assert.equal('function', typeof myModel._save);
        });

        it('should inject the method for retrieving models inside the models retrieved by the model method', function () {
            // Retrieving itself
            assert.equal('MyModel', instance.model('MyModel').model('MyModel').name);
        });

    });

});