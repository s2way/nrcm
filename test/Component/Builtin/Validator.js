/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it */
'use strict';

var assert = require('assert');
var expect = require('expect.js');
var Validator = require('./../../../src/Component/Builtin/Validator');

describe('Validator.js', function () {

    describe('validate', function () {
        var street, email, preferences, cpf, data;
        street = 'José de Alencar';
        email = 'davi@versul.com.br';
        preferences = ['Beer', 'Chips'];
        cpf = '02895328099';
        data = {
            'cpf' : cpf,
            'e-mail' : email,
            'password' : '123456',
            'address' : {
                'street' : street,
                'zipCode' : '93310-210'
            },
            'preferences' : preferences
        };

        it('should validate an empty object and return that it has failed', function (done) {
            var validate, validator;
            validate = {
                'field' : function (value, fields, callback) {
                    callback(value !== undefined);
                }
            };
            validator = new Validator({ 'validate' : validate});
            validator.validate({}, function (error) {
                expect(error.name).to.be('ValidationFailed');
                done();
            });
        });

        it('should execute the validation functions passing each field to be validated', function (done) {
            var validate = {
                'cpf' : function (value, validationData, callback) {
                    assert.equal(cpf, value);
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    callback(true);
                },
                'e-mail' : function (value, validationData, callback) {
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    assert.equal(JSON.stringify(value), JSON.stringify(email));
                    callback(true);
                },
                'address' : {
                    'street' : function (value, validationData, callback) {
                        assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                        assert.equal(street, value);
                        callback(true);
                    }
                },
                'preferences' : function (value, validationData, callback) {
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    assert.equal(JSON.stringify(value), JSON.stringify(preferences));
                    callback(true);
                }
            };
            var validator = new Validator({ 'validate' : validate, 'timeout' : 100 });
            validator.validate(data, function (error, validatedFields) {
                var expectedValidatedFields = {
                    'cpf' : true,
                    'e-mail' : true,
                    'address' : {
                        'street' : true
                    },
                    'preferences' : true
                };
                expect(error).not.to.be.ok();
                expect(JSON.stringify(validatedFields)).to.be(JSON.stringify(expectedValidatedFields));
                done();
            });
        });

        it('should return expired as true if the validation functions took too long', function (done) {
            var validate = {
                'cpf' : function (value, validationData, callback) {
                    assert.equal(cpf, value);
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    setTimeout(function () {
                        callback(true);
                    }, 10000);
                },
                'e-mail' : function (value, validationData, callback) {
                    assert.equal(email, value);
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    callback(true);
                },
                'address' : {
                    'street' : function (value, validationData, callback) {
                        assert.equal(street, value);
                        assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                        callback(true);
                    }
                },
                'preferences' : function (value, validationData, callback) {
                    assert.equal(JSON.stringify(preferences), JSON.stringify(value));
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    callback(true);
                }
            };
            var validator = new Validator({ 'validate': validate, 'timeout': 10 });
            validator.validate(data, function (error, validatedFields) {
                var expectedValidatedFields = {
                    'e-mail' : true,
                    'address' : {
                        'street' : true
                    },
                    'preferences' : true
                };
                expect(error.name).to.be('ValidationExpired');
                expect(JSON.stringify(validatedFields)).to.be(JSON.stringify(expectedValidatedFields));
                done();
            });
        });
    });

    describe('match', function () {
        it('should throw an error if the data is invalid', function () {
            var validate = {'title': false, 'description': false};
            var validator;
            try {
                validator = new Validator({'validate' : validate});
            } catch (e) {
                assert.fail();
            }
            try {
                validator.match({'title' : function () {
                    return;
                }});
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an error if the data is undefined or null', function () {
            var validator = new Validator({'validate' : {}, 'field' : true });
            try {
                validator.match();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an error if the data is other thing besides a json', function () {
            var validator = new Validator({'validate' : {}, 'field' : true });
            try {
                validator.match(function () {
                    return;
                });
                assert.fail();
            } catch (e) {
                expect(e.name).to.be('IllegalArgument');
            }
        });
        it('should return true if the data is according to the validate', function () {
            var validate = {
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
            var validator;
            try {
                validator = new Validator({'validate' : validate});
            } catch (e) {
                assert.fail();
            }
            assert(validator.match(data));
        });
        it('should return an error if there is a missing required field', function () {
            var validate = {
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
            var validator = new Validator({'validate' : validate});
            var result = validator.match(data);
            assert.equal(
                JSON.stringify({
                    'field' : 'array',
                    'level' : 1,
                    'error' : 'required'
                }),
                JSON.stringify(result)
            );
        });
        it('should return an error if there is a field that is not specified in the validate', function () {
            var validate = {
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
            var validator = new Validator({'validate' : validate});
            var result = validator.match(data);
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
