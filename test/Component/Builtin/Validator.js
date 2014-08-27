/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var Validator = require('./../../../src/Component/Builtin/Validator');

describe('Validator.js', function () {
    describe('isValid', function () {
        var logradouro = 'Rua José de Alencar';
        var email = 'davi@versul.com.br';
        var preferencias = ['Cerveja', 'Salgadinho'];
        var cpf = '02895328099';
        var data = {
            'cpf' : cpf,
            'e-mail' : email,
            'senha' : '123456',
            'endereco' : {
                'logradouro' : logradouro,
                'cep' : '93310-210',
            },
            'preferencias' : preferencias
        };
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
                'endereco' : {
                    'logradouro' : function (value, validationData, callback) {
                        assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                        assert.equal(logradouro, value);
                        callback(true);
                    }
                },
                'preferencias' : function (value, validationData, callback) {
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    assert.equal(JSON.stringify(value), JSON.stringify(preferencias));
                    callback(true);
                }
            };
            var validator = new Validator(validate, 100);
            validator.isValid(data, function (expired, succeeded, validatedFields) {
                var expectedValidatedFields = {
                    'cpf' : true,
                    'e-mail' : true,
                    'endereco' : {
                        'logradouro' : true
                    },
                    'preferencias' : true
                };
                assert.equal(expired, false);
                assert.equal(succeeded, true);
                assert.equal(JSON.stringify(expectedValidatedFields), JSON.stringify(validatedFields));
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
                'endereco' : {
                    'logradouro' : function (value, validationData, callback) {
                        assert.equal(logradouro, value);
                        assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                        callback(true);
                    }
                },
                'preferencias' : function (value, validationData, callback) {
                    assert.equal(JSON.stringify(preferencias), JSON.stringify(value));
                    assert.equal(JSON.stringify(data), JSON.stringify(validationData));
                    callback(true);
                }
            };
            var validator = new Validator(validate, 10);
            validator.isValid(data, function (expired, succeeded, validatedFields) {
                var expectedValidatedFields = {
                    'e-mail' : true,
                    'endereco' : {
                        'logradouro' : true
                    },
                    'preferencias' : true
                };
                assert.equal(succeeded, false);
                assert.equal(expired, true);
                assert.equal(JSON.stringify(expectedValidatedFields), JSON.stringify(validatedFields));
                done();
            });
        });
    });

});
