/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var ModelFactory = require('../../src/Model/ModelFactory');

describe('ModelFactory.js', function () {

    describe('create', function () {

        var instance, loader;
        var application = {
            'models' : {
                'MyModel' : function () {
                    this.uid = 'index';
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
        var dataSources = {
            'default' : {
                'type' : 'Couchbase'
            }
        };

        beforeEach(function () {
            loader = new ModelFactory(logger, application, dataSources, componentFactory);
            instance = loader.create('MyModel');
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
            // Just to be sure that this model really is MyModel
            assert.equal('MyModel', myModel.name);
            assert.equal(null, instance.model('InvalidModel'));
        });

        it('should inject all ModelInterface methods inside the models retrieved by the model method', function () {
            var myModel = instance.model('MyModel');

            assert.equal('function', typeof myModel.$findAll);
            assert.equal('function', typeof myModel.$findByKey);
            assert.equal('function', typeof myModel.$findById);
            assert.equal('function', typeof myModel.$find);
            assert.equal('function', typeof myModel.$removeById);
            assert.equal('function', typeof myModel.$save);
        });

        it('should inject all ModelInterface and they should throw a NotMocked if the DataSource mock parameter is true', function () {
            loader = new ModelFactory(logger, application, {
                'default' : {
                    'type' : 'MySQL',
                    'mock' : true
                }
            }, componentFactory);
            instance = loader.create('MyModel');
            var myModel = instance.model('MyModel');
            var methods = ['$query', '$use'];
            var i, method;
            for (i in methods) {
                if (methods.hasOwnProperty(i)) {
                    method = methods[i];
                    try {
                        myModel[method]();
                        assert.fail();
                    } catch (e) {
                        assert.equal('NotMocked', e.name);
                    }
                }
            }
        });

        it('should inject the $builder property normally even if the mock parameter is true', function () {
            loader = new ModelFactory(logger, application, {
                'default' : {
                    'type' : 'MySQL',
                    'mock' : true
                }
            }, componentFactory);
            instance = loader.create('MyModel');
            var myModel = instance.model('MyModel');
            assert.equal('function', typeof myModel.$builder);
        });

        it('should inject the method for retrieving models inside the models retrieved by the model method', function () {
            // Retrieving itself
            assert.equal('MyModel', instance.model('MyModel').model('MyModel').name);
        });

    });

});