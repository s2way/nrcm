var assert = require('assert');
var ExceptionsController = require('./../lib/ExceptionsController');

var instance = new ExceptionsController();

describe('ExceptionsController.js', function(){
	describe('onControllerNotFound', function(){
		it('should return a JSON object', function(){
			assert.equal('object', typeof instance.onControllerNotFound());
		});
	});

	describe('onApplicationNotFound', function(){
		it('should return a JSON object', function(){
			assert.equal('object', typeof instance.onApplicationNotFound());
		});
	});

	describe('onMethodNotFound', function(){
		it('should return a JSON object', function(){
			assert.equal('object', typeof instance.onMethodNotFound());
		});
	});

	describe('onForbidden', function(){
		it('should return a JSON object', function(){
			assert.equal('object', typeof instance.onForbidden());
		});
	});

	describe('onGeneral', function(){
		it('should return a JSON object', function(){
			assert.equal('object', typeof instance.onGeneral({}));
		});
	});
});
