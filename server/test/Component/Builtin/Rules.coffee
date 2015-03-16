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

    describe 'isBoolean()', ->
        it 'should return true when it is true or false', ->
            expect(instance.isBoolean true).to.be true
            expect(instance.isBoolean false).to.be true
        it 'should return false when it is true or false', ->
            expect(instance.isBoolean new Boolean(true)).to.be false
            expect(instance.isBoolean null).to.be false
            expect(instance.isBoolean undefined).to.be false

    describe 'isArray()', ->
        it 'should return true when it is an array', ->
            expect(instance.isArray []).to.be true
        it 'should return false when it is not an array', ->
            expect(instance.isArray {}).to.be false
            expect(instance.isArray null).to.be false
            expect(instance.isArray undefined).to.be false
            expect(instance.isArray '').to.be false
            expect(instance.isArray 0).to.be false

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

    describe 'exactLength', ->
        it 'should return false if it does not match the length', ->
            expect(instance.exactLength 'coconut', 2).to.be false
        it 'should return false if the value is not a string', ->
            expect(instance.exactLength false, 2).to.be false
            expect(instance.exactLength undefined, 2).to.be false
            expect(instance.exactLength null, 2).to.be false
            expect(instance.exactLength {}, 2).to.be false
            expect(instance.exactLength 1, 2).to.be false
            expect(instance.exactLength new String('not a literal'), 2).to.be false
        it 'should return true if the value matches the length', ->
            expect(instance.exactLength 'coconut', 7).to.be true

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

    describe 'email', ->
        it 'should return true if the email address is valid', ->
            expect(instance.email 'davi.gbr@gmail.com').to.be true
        it 'should return false if the email address is not valid', ->
            expect(instance.email 'this is not an email').to.be false

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

    describe 'datetime', ->
        it 'should return true if it is a valid string datetime', ->
            expect(instance.datetime '2014-01-01T00:11:22').to.be true
        it 'should return false if it is not a valid string datetime', ->
            expect(instance.datetime '2014-01-01').to.be false
            expect(instance.datetime '2014-01').to.be false
            expect(instance.datetime '2014-01-123-').to.be false

    describe 'test', ->

        it 'should validate the field if the rules are passed as an object and return the rules that did not pass', ->
            rules =
                notEmpty:
                    rule: 'notEmpty'
                    message: 'This field cannot be empty'
                maxLength:
                    message: 'This field has exceeded the max length'
                    params: [4]

            result = instance.test 'A field', rules
            expect(result).to.be.an 'object'
            expect(result).to.have.property('maxLength')
            expect(result).not.to.have.property('notEmpty')

        it 'should return all rules failed if they are marked as required: false and the data is undefined', ->
            rules =
                notEmpty:
                    rule: 'notEmpty'
                    message: 'This field cannot be empty'
                    required: true
                maxLength:
                    message: 'This field has exceeded the max length'
                    params: [4]
                    required: true

            result = instance.test undefined, rules
            expect(result).to.be.an 'object'
            expect(result).to.have.property('maxLength')
            expect(result).to.have.property('notEmpty')

        it 'should return success if the rules are marked as required: false and the data is undefined', ->
            rules =
                notEmpty:
                    rule: 'notEmpty'
                    message: 'This field cannot be empty'
                    required: false
                maxLength:
                    message: 'This field has exceeded the max length'
                    params: [4]
                # required: false # The default value is false!

            result = instance.test undefined, rules
            expect(result).to.be null

        it 'should return null when all fields have passed the validation', ->
            rules =
                notEmpty: {}
            result = instance.test 'A field', rules
            expect(result).to.be null

        it 'should throw an IllegalArgument exception if the rule does not exist', ->
            rules = invalidRule: null
            expect(->
                instance.test 'nothing', rules
            ).to.throwException((e) -> expect(e.name).to.be 'IllegalArgument')

    describe 'isUseful()', ->

        it 'should return false to an empty string', ->
            result = instance.isUseful ''
            expect(result).not.to.be.ok()

        it 'should return false to an undefined string', ->
            result = instance.isUseful undefined
            expect(result).not.to.be.ok()

        it 'should return false to a null', ->
            result = instance.isUseful null
            expect(result).not.to.be.ok()

        it 'should return true to a zero', ->
            result = instance.isUseful 0
            expect(result).to.be.ok()

        it 'should return true to a ten', ->
            result = instance.isUseful 10
            expect(result).to.be.ok()

        it 'should return false to an empty array', ->
            result = instance.isUseful []
            expect(result).not.to.be.ok()

        it 'should return true to a populated array', ->
            result = instance.isUseful [1,2]
            expect(result).to.be.ok()

        it 'should return false to an empty object', ->
            result = instance.isUseful {}
            expect(result).not.to.be.ok()

        it 'should return true to a populated object', ->
            result = instance.isUseful {id:15}
            expect(result).to.be.ok()

        it 'should return false to a false boolean', ->
            result = instance.isUseful false
            expect(result).not.to.be.ok()

        it 'should return true to a true boolean', ->
            result = instance.isUseful true
            expect(result).to.be.ok()

        it 'should return true to a zero float', ->
            result = instance.isUseful 0.0
            expect(result).to.be.ok()

        it 'should return true to a zero float', ->
            result = instance.isUseful 0.000000000
            expect(result).to.be.ok()

        it 'should return true to a zero float', ->
            result = instance.isUseful 0.000000001
            expect(result).to.be.ok()

        it 'should return true to a one float', ->
            result = instance.isUseful 1.0
            expect(result).to.be.ok()