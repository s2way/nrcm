###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

Rules = require '../../../src/Component/Builtin/Rules'
expect = require 'expect.js'

describe 'Rules', ->

    describe 'isNumber()', ->
        it 'should return true if value is a number', ->
            expect(Rules.isNumber(1)).to.be.ok()
        it 'should return true if value is a Number', ->
            expect(Rules.isNumber(new Number 1)).to.be.ok()
        it 'should return false if value is not a number', ->
            expect(Rules.isNumber({})).not.be.ok()
        it 'should return false if value is null or undefined', ->
            expect(Rules.isNumber(null)).not.to.be.ok()
            expect(Rules.isNumber(undefined)).not.to.be.ok()

    describe 'isString()', ->
        it 'should return true if value is a string', ->
            expect(Rules.isString 'string').to.be.ok()
            expect(Rules.isString new String('string')).to.be.ok()
        it 'should return false if value is not a string', ->
            expect(Rules.isString null).not.to.be.ok()
            expect(Rules.isString undefined).not.to.be.ok()
            expect(Rules.isString {}).not.to.be.ok()
            expect(Rules.isString 1).not.to.be.ok()

    describe 'isNull()', ->
        it 'should return true if value is null', ->
            expect(Rules.isNull null).to.be.ok()
        it 'should return false if value is not null', ->
            expect(Rules.isNull false).not.to.be.ok()

    describe 'isBoolean()', ->
        it 'should return true if value true or false', ->
            expect(Rules.isBoolean true).to.be.ok()
            expect(Rules.isBoolean false).to.be.ok()
            expect(Rules.isBoolean new Boolean(true)).to.be.ok()
        it 'should return false if value is not true or false', ->
            expect(Rules.isBoolean null).not.to.be.ok()
            expect(Rules.isBoolean undefined).not.to.be.ok()

    describe 'isArray()', ->
        it 'should return true if value is an array', ->
            expect(Rules.isArray []).to.be.ok()
        it 'should return false if value is not an array', ->
            expect(Rules.isArray {}).not.to.be.ok()
            expect(Rules.isArray null).not.to.be.ok()
            expect(Rules.isArray undefined).not.to.be.ok()
            expect(Rules.isArray '').not.to.be.ok()
            expect(Rules.isArray 0).not.to.be.ok()

    describe 'isUndefined()', ->
        it 'should return true if value is undefined', ->
            expect(Rules.isUndefined undefined).to.be.ok()
        it 'should return false if value is not undefined', ->
            expect(Rules.isUndefined null).not.to.be.ok()

    describe 'notNull()', ->
        it 'should return true if value is not null', ->
            expect(Rules.notNull undefined).to.be.ok()
        it 'should return false if value is null', ->
            expect(Rules.notNull null).not.to.be.ok()

    describe 'notEmpty()', ->
        it 'should return true if value is a string', ->
            expect(Rules.notEmpty new String('not a literal')).to.be.ok()
        it 'should return false if value is empty', ->
            expect(Rules.notEmpty '').not.to.be.ok()
        it 'should return true if value is not empty', ->
            expect(Rules.notEmpty 'a string').to.be.ok()

    describe 'maxLength', ->
        it 'should return false if value it is not a string literal', ->
            expect(Rules.maxLength new String('not a literal')).not.to.be.ok()
        it 'should return false if value has more chars than allowed', ->
            expect(Rules.maxLength 'string', 3).not.to.be.ok()
        it 'should return true if value has the same number of allowed chars', ->
            expect(Rules.maxLength 'string', 6).to.be.ok()
        it 'should return true if value has less than the max number of chars', ->
            expect(Rules.maxLength 'string', 7).to.be.ok()

    describe 'minLength', ->
        it 'should return true if value is a string literal', ->
            expect(Rules.minLength new String('not a literal')).to.be.ok()
        it 'should return false if value has less chars than the minimum', ->
            expect(Rules.minLength 'string', 20).not.to.be.ok()
        it 'should return true if value has the same number of minimum chars', ->
            expect(Rules.minLength 'string', 6).to.be.ok()
        it 'should return true if value has more than the min number of chars', ->
            expect(Rules.minLength 'string', 2).to.be.ok()

    describe 'lengthBetween', ->
        it 'should return true if value length is between the range', ->
            expect(Rules.lengthBetween 'string', 6, 6).to.be.ok()
            expect(Rules.lengthBetween 'string', 5, 7).to.be.ok()
        it 'should return false if value length is not between the range', ->
            expect(Rules.lengthBetween 'string', 7, 6).not.to.be.ok()
            expect(Rules.lengthBetween 'string', 8, 9).not.to.be.ok()
            expect(Rules.lengthBetween 'string', 1, 2).not.to.be.ok()

#    describe 'exactLength', ->
#        it 'should return false if it does not match the length', ->
#            expect(Rules.exactLength 'coconut', 2).to.be false
#        it 'should return false if the value is not a string', ->
#            expect(Rules.exactLength false, 2).to.be false
#            expect(Rules.exactLength undefined, 2).to.be false
#            expect(Rules.exactLength null, 2).to.be false
#            expect(Rules.exactLength {}, 2).to.be false
#            expect(Rules.exactLength 1, 2).to.be false
#            expect(Rules.exactLength new String('not a literal'), 2).to.be false
#        it 'should return true if the value matches the length', ->
#            expect(Rules.exactLength 'coconut', 7).to.be true
#
#    describe 'regex', ->
#        it 'should test a regex against a string', ->
#            expect(Rules.regex '1', /\d/gi).to.be true
#
#    describe 'min', ->
#        it 'should return true if it is greater or equal than min', ->
#            expect(Rules.min 1, 1).to.be true
#            expect(Rules.min 1, 0).to.be true
#        it 'should return false if it is less than min', ->
#            expect(Rules.min 1, 2).to.be false
#
#    describe 'max', ->
#        it 'should return true if it is less or equal than max', ->
#            expect(Rules.max 1, 2).to.be true
#            expect(Rules.max 1, 1).to.be true
#        it 'should return false if it is greater than max', ->
#            expect(Rules.max 3, 2).to.be false
#
#    describe 'alphaNumeric', ->
#        it 'should return true if the string is alphanumeric', ->
#            expect(Rules.alphaNumeric 'thisIS_alpha_Numeric').to.be true
#        it 'should return false if the string is not alphanumeric', ->
#            expect(Rules.alphaNumeric 'this is not alpha numeric :(').to.be false
#
#    describe 'email', ->
#        it 'should return true if the email address is valid', ->
#            expect(Rules.email 'davi.gbr@gmail.com').to.be true
#        it 'should return false if the email address is not valid', ->
#            expect(Rules.email 'this is not an email').to.be false
#
#    describe 'date', ->
#        it 'should return true if it is a valid string date', ->
#            expect(Rules.date '2014-01-01').to.be true
#        it 'should return false if it is not a valid string date', ->
#            expect(Rules.date '2014-01').to.be false
#            expect(Rules.date '2014-01-123-').to.be false
#            expect(Rules.date '2014-01-01T00:11:22').to.be false
#
#    describe 'time', ->
#        it 'should return true if it is a valid string time', ->
#            expect(Rules.time '23:59:59').to.be true
#        it 'should return false if it is not a valid string time', ->
#            expect(Rules.time '2014-01-01').to.be false
#            expect(Rules.time '00:00').to.be false
#            expect(Rules.time '2014-01-01T00:11:22').to.be false
#
#    describe 'datetime', ->
#        it 'should return true if it is a valid string datetime', ->
#            expect(Rules.datetime '2014-01-01T00:11:22').to.be true
#        it 'should return false if it is not a valid string datetime', ->
#            expect(Rules.datetime '2014-01-01').to.be false
#            expect(Rules.datetime '2014-01').to.be false
#            expect(Rules.datetime '2014-01-123-').to.be false
#
#    describe 'isUseful()', ->
#
#        it 'should return false to an empty string', ->
#            result = Rules.isUseful ''
#            expect(result).not.to.be.ok()
#
#        it 'should return false to an undefined string', ->
#            result = Rules.isUseful undefined
#            expect(result).not.to.be.ok()
#
#        it 'should return false to a null', ->
#            expect(Rules.isUseful null).not.to.be.ok()
#
#        it 'should return true to a zero', ->
#            expect(Rules.isUseful 0).to.be.ok()
#
#        it 'should return true to a ten', ->
#            expect(Rules.isUseful 10).to.be.ok()
#
#        it 'should return false to an empty array', ->
#            expect(Rules.isUseful []).not.to.be.ok()
#
#        it 'should return true to a populated array', ->
#            expect(Rules.isUseful [1,2]).to.be.ok()
#
#        it 'should return false to an empty object', ->
#            expect(Rules.isUseful {}).not.to.be.ok()
#
#        it 'should return true to a populated object', ->
#            expect(Rules.isUseful {id:15}).to.be.ok()
#
#        it 'should return false to a false boolean', ->
#            expect(Rules.isUseful false).not.to.be.ok()
#
#        it 'should return true to a true boolean', ->
#            expect(Rules.isUseful true).to.be.ok()
#
#        it 'should return true to a zero float', ->
#            expect(Rules.isUseful 0.0).to.be.ok()
#
#        it 'should return true to a zero float', ->
#            expect(Rules.isUseful 0.000000000).to.be.ok()
#
#        it 'should return true to a zero float', ->
#            expect(Rules.isUseful 0.000000001).to.be.ok()
#
#        it 'should return true to a one float', ->
#    describe 'isInteger()', ->
#        it 'should return true if it is an integer', ->
#            expect(Rules.isInteger(1)).to.be true
#        it 'should return false if it is a float', ->
#            expect(Rules.isInteger(1.1)).to.be false
#        it 'should return false in any other case', ->
#            expect(Rules.isInteger(null)).to.be false
#            expect(Rules.isInteger(undefined)).to.be false
#            expect(Rules.isInteger({})).to.be false
#            expect(Rules.isInteger(new Number(1))).to.be false
#
#    describe 'isZero()', ->
#        it 'should return true when it is zero', ->
#            expect(Rules.isZero 0).to.be true
#        it 'should return false when it is not zero', ->
#            expect(Rules.isZero undefined).to.be false
#            expect(Rules.isZero null).to.be false
#            expect(Rules.isZero 1).to.be false
#            expect(Rules.isZero 'zero').to.be false
#            expect(Rules.isZero false).to.be false
#
#    describe 'isOne()', ->
#        it 'should return true when it is one', ->
#            expect(Rules.isOne 1).to.be true
#        it 'should return false when it is not one', ->
#            expect(Rules.isOne undefined).to.be false
#            expect(Rules.isOne null).to.be false
#            expect(Rules.isOne -1).to.be false
#            expect(Rules.isOne 'zero').to.be false
#            expect(Rules.isOne false).to.be false
#
#            expect(Rules.isUseful 1.0).to.be.ok()
