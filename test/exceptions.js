var exceptions = require("./../src/exceptions");
var assert = require("assert");

describe('exceptions.js', function() {
	for (var exceptionClass in exceptions) {
		describe(exceptionClass, function() {
			var message = 'exception message';
			describe('.name', function() {
				it('should contain the name of the class', function(){
					var exceptionInstance = new exceptions[exceptionClass](message);
					assert.equal(exceptionClass, exceptionInstance.name);
				});
			});
			describe('.message', function(){
				it('should contain the exception message', function(){
					var exceptionInstance = new exceptions[exceptionClass](message);
					assert.equal(message, exceptionInstance.message);
				});
			});
		});
	}
});