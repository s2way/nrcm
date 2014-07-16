/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var SchemaMatcher = require('./../../src/Model/SchemaMatcher');

describe('SchemaMatcher.js', function () {
    describe('SchemaMatcher', function () {
        it('should throw an error if the schema is invalid', function () {
            try {
                new SchemaMatcher({'title' : function () {}});
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an error if the schema is undefined or null', function () {
            try {
                new SchemaMatcher();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
    });
    describe('match', function () {
        it('should throw an error if the data is invalid', function () {
            var schema = {'title':'string','description':''};
            try {
                var sm = new SchemaMatcher(schema);             
            } catch (e) {
                assert.fail();                  
            }
            try {
                sm.match({'title' : function () {}});
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
            try {
                var sm = new SchemaMatcher(schema);             
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
        it('should throw an error if the data is other thing besides json', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : {
                    'object' : {'array' : []},
                }
            };
            try {
                var sm = new SchemaMatcher(schema);             
            } catch (e) {
                assert.fail();                  
            }
            try {
                sm.match(function() {});
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
                'array' : [0,1,3],
                'object' : {
                    'object' : {'array' : [0,1,2]},
                    'number' : 100
                }
            };
            try {
                var sm = new SchemaMatcher(schema);             
            } catch (e) {
                assert.fail();                  
            }
            try {
                assert(sm.match(data));
            } catch (e) {
                assert.fail();
            }
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
                'array' : [0,1,3],
                'object' : {
                    'object' : {'array' : [0,1,2]},
                    'number' : 'not_number'
                }
            };
            try {
                var sm = new SchemaMatcher(schema);             
            } catch (e) {
                assert.fail();                  
            }
            try {
                var x = sm.match(data);
                assert.fail();
            } catch (e) {
                assert.equal(x, false);
            }
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
                'array' : [0,1,3],
                'object' : {
                    'object' : {'array' : []},
                    'number' : 'not_number'
                }
            };
            try {
                var sm = new SchemaMatcher(schema);             
            } catch (e) {
                assert.fail();                  
            }
            try {
                var x = sm.match(data);
                assert.fail();
            } catch (e) {
                assert.equal(x, false);
            }
        });
        it('should return false if the schema is expecting an object and data it is not an object', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : []
            };
            var data = {
                'string': 'string',
                'array' : [0,1,3],
                'object' : {
                    'object' : {'array' : []},
                    'number' : 'not_number'
                }
            };
            try {
                var sm = new SchemaMatcher(schema);             
            } catch (e) {
                assert.fail();                  
            }
            try {
                var x = sm.match(data);
                assert.fail();
            } catch (e) {
                assert.equal(x, false);
            }
        });
        it('should return false if the data contains more data then schema expects', function () {
            var schema = {
                'string' : 'string',
                'array' : [],
                'object' : []
            };
            var data = {
                'x': 'string',
                'array' : [0,1,3],
            };
            try {
                var sm = new SchemaMatcher(schema);             
            } catch (e) {
                assert.fail();                  
            }
            try {
                var x = sm.match(data);
                assert.fail();
            } catch (e) {
                assert.equal(x, false);
            }
        });
    });
});
