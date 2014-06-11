var assert = require('assert');
var Validator = require('./../../src/Model/Validator');

describe('Validator.js', function(){
	describe('isValid', function(){
		var data = {
			'cpf' : '02895328099',
			'e-mail' : 'davi@versul.com.br',
			'senha' : '123456',
			'endereco' : {
				'logradouro' : 'Rua José de Alencar',
				'cep' : '93310-210',
			},
			'preferencias' : ['Cerveja', 'Salgadinho']
		};
		it('should execute the validation functions passing each field to be validated', function(done){
			var validate = {
				'cpf' : function(value, data, callback) {
					callback(true);
				},
				'e-mail' : function(value, data, callback) {
					callback(true);
				},
				'endereco' : {
					'logradouro' : function(value, data, callback) {
						callback(true);
					}
				},
				'preferencias' : function(value, data, callback) {
					callback(true);
				}
			};
			var validator = new Validator(validate, 100);
			validator.isValid(data, function(expired, succeeded, validatedFields){
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
		it('should return expired as true if the validation functions took too long', function(done) {
			var validate = {
				'cpf' : function(value, data, callback) {
					setTimeout(function(){
						callback(true);
					}, 10000);
				},
				'e-mail' : function(value, data, callback) {
					callback(true);
				},
				'endereco' : {
					'logradouro' : function(value, data, callback) {
						callback(true);
					}
				},
				'preferencias' : function(value, data, callback) {
					callback(true);
				}
			};
			var validator = new Validator(validate, 10);
			validator.isValid(data, function(expired, succeeded, validatedFields){
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
