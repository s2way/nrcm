/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var StringUtils = require('./../../src/Util/StringUtils');

describe('StringUtils.js', function () {

    describe('firstLetterUp', function () {
        it('should capitalize the first letter', function () {
            assert.equal('CamelCase', StringUtils.firstLetterUp('camelCase'));
            assert.equal('Lower_case_underscored', StringUtils.firstLetterUp('lower_case_underscored'));
        });
        it('should return an empty string if an empty string is passed', function () {
            assert.equal('', StringUtils.firstLetterUp(''));
        });
    });

    describe('lowerCaseUnderscoredToCamelCase', function () {
        it('should convert lowercase underscored strings to camelcase', function () {
            assert.equal('CamelCase.CamelCase', StringUtils.lowerCaseUnderscoredToCamelCase('camel_case.camel_case'));
        });
    });

    describe('camelCaseToLowerCaseUnderscored', function () {
        it('should convert camelcase strings to lowercase underscored', function () {
            assert.equal('camel_case.camel_case', StringUtils.camelCaseToLowerCaseUnderscored('CamelCase.CamelCase'));
        });
    });
});
