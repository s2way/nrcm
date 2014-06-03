var assert = require('assert');
var stringUtils = require('./../lib/stringUtils');

describe('stringUtils.js', function() {

	describe('firstLetterUp', function() {
		it('should capitalize the first letter', function(){
			assert.equal('CamelCase', stringUtils.firstLetterUp('camelCase'));
			assert.equal('Lower_case_underscored', stringUtils.firstLetterUp('lower_case_underscored'));
		});
		it('should return an empty string if an empty string is passed', function(){
			assert.equal('', stringUtils.firstLetterUp(''));
		})
	});

	describe('lowerCaseUnderscoredToCamelCase', function(){
		it('should convert lowercase underscored strings to camelcase', function() {
			assert.equal('CamelCase', stringUtils.lowerCaseUnderscoredToCamelCase('camel_case'));
		});
	});

	describe('camelCaseToLowerCaseUnderscored', function(){
		it('should convert camelcase strings to lowercase underscored', function() {
			assert.equal('camel_case', stringUtils.camelCaseToLowerCaseUnderscored('CamelCase'));
		});
	});
});
