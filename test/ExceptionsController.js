var assert = require('assert');
var ExceptionsController = require('./../src/ExceptionsController');

var instance = new ExceptionsController();

describe('ExceptionsController.js', function(){
	describe('onControllerNotFound', function(){
		it('should return a JSON object', function(){
			instance.onControllerNotFound(function(){});
		});
	});

	describe('onApplicationNotFound', function(){
		it('should return a JSON object', function(){
			instance.onApplicationNotFound(function(){});
		});
	});

	describe('onMethodNotFound', function(){
		it('should return a JSON object', function(){
			instance.onMethodNotFound(function(){});
		});
	});

	describe('onForbidden', function(){
		it('should return a JSON object', function(){
			instance.onForbidden(function(){});
		});
	});

	describe('onGeneral', function(){
		it('should return a JSON object', function(){
			instance.onGeneral(function(){}, {});
		});
	});
});
