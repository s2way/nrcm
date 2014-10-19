Rules = require '../../../src/Component/Builtin/Rules'
expect = require 'expect.js'

describe 'Rules', ->

    instance = new Rules

    describe 'isNumber()', ->
        it 'should return true if the passed value is a number', ->
            expect(instance.isNumber(1)).to.be true
        it 'should return false if the passed value is an instance of Number', ->
            expect(instance.isNumber(new Number 1)).to.be false
        it 'should return false if the passed value is not a number', ->
            expect(instance.isNumber({})).to.be false
        it 'should return false if the passed value is null or undefined', ->
            expect(instance.isNumber(null)).to.be false
            expect(instance.isNumber(undefined)).to.be false

    describe 'isInteger()', ->
        it 'should return true if it is an integer', ->
            expect(instance.isInteger(1)).to.be true
        it 'should return false if it is a float', ->
            expect(instance.isInteger(1.1)).to.be false
        it 'should return false in any other case', ->
            expect(instance.isInteger(null)).to.be false
            expect(instance.isInteger(undefined)).to.be false
            expect(instance.isInteger({})).to.be false
            expect(instance.isInteger(new Number(1))).to.be false

    describe 'isZero()', ->
        it 'should return true when it is zero', ->
            expect(instance.isZero 0).to.be true
        it 'should return false when it is not zero', ->
            expect(instance.isZero undefined).to.be false
            expect(instance.isZero null).to.be false
            expect(instance.isZero 1).to.be false
            expect(instance.isZero 'zero').to.be false
            expect(instance.isZero false).to.be false

    describe 'isOne()', ->
        it 'should return true when it is one', ->
            expect(instance.isOne 1).to.be true
        it 'should return false when it is not one', ->
            expect(instance.isOne undefined).to.be false
            expect(instance.isOne null).to.be false
            expect(instance.isOne -1).to.be false
            expect(instance.isOne 'zero').to.be false
            expect(instance.isOne false).to.be false

    describe 'isString()', ->
        it 'should return true when it is a string literal', ->
            expect(instance.isString 'string').to.be true
        it 'should return false when it is not a string literal', ->
            expect(instance.isString new String('string')).to.be false
            expect(instance.isString null).to.be false
            expect(instance.isString undefined).to.be false
            expect(instance.isString {}).to.be false
            expect(instance.isString 1).to.be false

    describe 'isNull()', ->
        it 'should return true when it is null', ->
            expect(instance.isNull null).to.be true
        it 'should return false when it is not null', ->
            expect(instance.isNull false).to.be false

    describe 'isUndefined()', ->
        it 'should return true if it is undefined', ->
            expect(instance.isUndefined undefined).to.be true
        it 'should return false if it is not undefined', ->
            expect(instance.isUndefined null).to.be false

    describe 'notNull()', ->
        it 'should return true if it is not null', ->
            expect(instance.notNull undefined).to.be true
        it 'should return false if it is null', ->
            expect(instance.notNull null).to.be false

    describe 'notEmpty()', ->
        it 'should return false if it is not a string literal', ->
            expect(instance.notEmpty new String('not a literal')).to.be false
        it 'should return false if it is empty', ->
            expect(instance.notEmpty '').to.be false
        it 'should return true if it is not empty', ->
            expect(instance.notEmpty 'a string').to.be true

    describe 'maxLength', ->
        it 'should return false if it is not a string literal', ->
            expect(instance.maxLength new String('not a literal')).to.be false
        it 'should return false if the string has more chars than allowed', ->
            expect(instance.maxLength 'string', 3).to.be false
        it 'should return true if the string has the same number of allowed chars', ->
            expect(instance.maxLength 'string', 6).to.be true
        it 'should return true if the string has less than the max number of chars', ->
            expect(instance.maxLength 'string', 7).to.be true

    describe 'minLength', ->
        it 'should return false if it is not a string literal', ->
            expect(instance.minLength new String('not a literal')).to.be false
        it 'should return false if the string has less chars than the minimum', ->
            expect(instance.minLength 'string', 20).to.be false
        it 'should return true if the string has the same number of minimum chars', ->
            expect(instance.minLength 'string', 6).to.be true
        it 'should return true if the string has more than the min number of chars', ->
            expect(instance.minLength 'string', 2).to.be true

    describe 'lengthBetween', ->
        it 'should return false if it is not a string literal', ->
            expect(instance.lengthBetween new String('not a literal')).to.be false
        it 'should return true if the string length is between the range', ->
            expect(instance.lengthBetween 'string', 6, 6).to.be true
            expect(instance.lengthBetween 'string', 5, 7).to.be true
        it 'should return false if the string length is not between the range', ->
            expect(instance.lengthBetween 'string', 7, 6).to.be false
            expect(instance.lengthBetween 'string', 8, 9).to.be false
            expect(instance.lengthBetween 'string', 1, 2).to.be false

    describe 'regex', ->
        it 'should test a regex against a string', ->
            expect(instance.regex '1', /\d/gi).to.be true

    describe 'min', ->
        it 'should return true if it is greater or equal than min', ->
            expect(instance.min 1, 1).to.be true
            expect(instance.min 1, 0).to.be true
        it 'should return false if it is less than min', ->
            expect(instance.min 1, 2).to.be false

    describe 'max', ->
        it 'should return true if it is less or equal than max', ->
            expect(instance.max 1, 2).to.be true
            expect(instance.max 1, 1).to.be true
        it 'should return false if it is greater than max', ->
            expect(instance.max 3, 2).to.be false

    describe 'alphaNumeric', ->
        it 'should return true if the string is alphanumeric', ->
            expect(instance.alphaNumeric 'thisIS_alpha_Numeric').to.be true
        it 'should return false if the string is not alphanumeric', ->
            expect(instance.alphaNumeric 'this is not alpha numeric :(').to.be false

    describe 'date', ->
        it 'should return true if it is a valid string date', ->
            expect(instance.date '2014-01-01').to.be true
        it 'should return false if it is not a valid string date', ->
            expect(instance.date '2014-01').to.be false
            expect(instance.date '2014-01-123-').to.be false
            expect(instance.date '2014-01-01T00:11:22').to.be false

    describe 'time', ->
        it 'should return true if it is a valid string time', ->
            expect(instance.time '23:59:59').to.be true
        it 'should return false if it is not a valid string time', ->
            expect(instance.time '2014-01-01').to.be false
            expect(instance.time '00:00').to.be false
            expect(instance.time '2014-01-01T00:11:22').to.be false
