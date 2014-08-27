/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var SchemaMatcher = require('./../../../src/Model/SchemaMatcher');

describe('SchemaMatcher.js', function () {

    describe('SchemaMatcher', function () {
        it('should throw an error if the schema is invalid', function () {
            var sm;
            try {
                sm = new SchemaMatcher({'title' : function () {
                    return;
                }});
                assert(sm);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an error if the schema is undefined or null', function () {
            var sm;
            try {
                sm = new SchemaMatcher();
                assert(sm);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
    });
    describe('match', function () {
        it('should throw an error if the data is invalid', function () {
            var schema = {'title': false, 'description': false};
            var sm;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            try {
                sm.match({'title' : function () {
                    return;
                }});
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an error if the data is undefined or null', function () {
            var sm = new SchemaMatcher({ 'field' : true });
            try {
                sm.match();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an error if the data is other thing besides a json', function () {
            var sm = new SchemaMatcher({ 'field' : true });
            try {
                sm.match(function () {
                    return;
                });
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should return true if the data is according to schema', function () {
            var schema = {
                'string' : true,
                'array' : true,
                'object' : {
                    'object' : {
                        'array' : false
                    },
                    'number' : true
                }
            };
            var data = {
                'string': 'string',
                'array' : [0, 1, 3],
                'object' : {
                    'object' : {'array' : [0, 1, 2]},
                    'number' : 100
                }
            };
            var sm;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            assert(sm.match(data));
        });
        it('should return an error if there is a missing required field', function () {
            var schema = {
                'string' : false,
                'array' : true,
                'object' : {
                    'object' : {
                        'array' : false
                    },
                    'number' : false
                }
            };
            var data = {
                'string': 'string',
                'object' : {
                    'object' : {'array' : [0, 1, 2]},
                    'number' : 'not_number'
                }
            };
            var sm = new SchemaMatcher(schema);
            var result = sm.match(data);
            assert.equal(
                JSON.stringify({
                    'field' : 'array',
                    'level' : 1,
                    'error' : 'required'
                }),
                JSON.stringify(result)
            );
        });
        it('should return an error if there is a field that is not specified in the schema', function () {
            var schema = {
                'string' : false,
                'array' : false,
                'object' : {
                    'object' : false,
                    'number' : false
                }
            };
            var data = {
                'object' : {
                    'iShouldnt' : 'beHere'
                }
            };
            var sm = new SchemaMatcher(schema);
            var result = sm.match(data);
            assert.equal(
                JSON.stringify({
                    'field' : 'iShouldnt',
                    'level' : 2,
                    'error' : 'denied'
                }),
                JSON.stringify(result)
            );
        });
    });
});
