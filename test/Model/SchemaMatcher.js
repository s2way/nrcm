/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var SchemaMatcher = require('./../../src/Model/SchemaMatcher');

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
            var schema = {'title': 'string', 'description': ''};
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
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : {
                    'object' : {'array' : []},
                }
            };
            var sm;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            try {
                sm.match();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an error if the data is other thing besides a json', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : {
                    'object' : {'array' : []},
                }
            };
            var sm;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
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
                'string' : 'string',
                'array' : [],
                'object' : {
                    'object' : {'array' : []},
                    'number' : 0
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
        it('should return false if the data is not according to schema', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : {
                    'object' : {'array' : []},
                    'number' : 0
                }
            };
            var data = {
                'string': 'string',
                'array' : [0, 1, 3],
                'object' : {
                    'object' : {'array' : [0, 1, 2]},
                    'number' : 'not_number'
                }
            };
            var sm, x;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            x = sm.match(data);
            assert.notEqual(x, true);
        });
        it('should return false if the schema is expecting an array and data it is not an array', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : {
                    'object' : {'array' : {}},
                    'number' : 0
                }
            };
            var data = {
                'string': 'string',
                'array' : [0, 1, 3],
                'object' : {
                    'object' : {'array' : []},
                    'number' : 'not_number'
                }
            };
            var sm, x;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            x = sm.match(data);
            assert.notEqual(x, true);
        });
        it('should return false if the schema is expecting an object and data it is not an object', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : []
            };
            var data = {
                'string': 'string',
                'array' : [0, 1, 3],
                'object' : {
                    'object' : {'array' : []},
                    'number' : 'not_number'
                }
            };
            var sm, x;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            x = sm.match(data);
            assert.notEqual(x, true);
        });
        it('should return false if the data contains more data then schema expects', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : []
            };
            var data = {
                'x': 'string',
                'array' : [0, 1, 3],
            };
            var sm, x;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            x = sm.match(data);
            assert.notEqual(x, true);
        });
        it('should return true if the data matchs against the wildcard * (any typeof)', function () {
            var schema = {
                'any1' : '*',
                'any2' : '*',
                'any3' : '*',
                'any4' : '*'
            };
            var data = {
                'any1': 'string',
                'any2' : [0, 1, 3],
                'any3' : 1,
                'any4' : {}
            };
            var sm, x;
            try {
                sm = new SchemaMatcher(schema);
            } catch (e) {
                assert.fail();
            }
            x = sm.match(data);
            assert.equal(x, true);
        });
    });
});
