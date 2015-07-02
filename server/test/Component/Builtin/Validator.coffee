###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

assert = require('assert')
expect = require('expect.js')
Validator = require('./../../../src/Component/Builtin/Validator')
Rules = require('./../../../src/Component/Builtin/Rules')
Navigator = require('./../../../src/Component/Builtin/Navigator')

describe 'Validator.js', ->
    describe 'validate', ->
        street = 'José de Alencar'
        email = 'davi@versul.com.br'
        preferences = [
            'Beer'
            'Chips'
        ]
        cpf = '02895328099'
        data =
            cpf: cpf
            'e-mail': email
            password: '123456'
            address:
                street: street
                zipCode: '93310-210'

            preferences: preferences

        it 'should execute the validation functions passing each field to be validated', (done) ->
            validate =
                cpf: (value, validationData, callback) ->
                    assert.equal cpf, value
                    assert.equal JSON.stringify(data), JSON.stringify(validationData)
                    callback()

                'e-mail': (value, validationData, callback) ->
                    callback()

                'address.street': (value, validationData, callback) ->
                    callback()

                preferences: (value, validationData, callback) ->
                    callback()

            validator = new Validator(
                validate: validate
                timeout: 1000
            )
            validator._navigator = new Navigator()
            validator.validate data, (error, validatedFields, fieldErrors) ->
                expect(error).not.to.be.ok()
                expect(fieldErrors).to.eql {}
                done()

        it 'should execute the validation rules passing each field to be validated', (done) ->
            validate =
                'e-mail':
                    'notEmpty': rule: 'notEmpty', message: 'This field cannot be empty'
                    'email' : rule: 'email', message: 'This is not a valid e-mail address'
                'address.street':
                    'maxLength': rule: 'maxLength', message: 'Cannot contain more than 100 chars', params: [100]

            validator = new Validator(
                validate: validate
                timeout: 100
            )
            validator._navigator = new Navigator()
            validator._rules = new Rules()
            validator.validate data, (error, validatedFields) ->
                expectedValidatedFields =
                    'e-mail': true
                    'address.street': true

                expect(error).not.to.be.ok()
                expect(validatedFields).to.eql expectedValidatedFields
                done()


        it 'should return expired as true if the validation functions took too long', (done) ->
            validate =
                cpf: (value, validationData, callback) ->
                    setTimeout (->
                        callback()
                    ), 10000

                'e-mail': (value, validationData, callback) ->
                    callback()

                'address.street': (value, validationData, callback) ->
                    callback()

                preferences: (value, validationData, callback) ->
                    callback()

            validator = new Validator(
                validate: validate
                timeout: 10
            )
            validator._navigator = new Navigator()
            validator._rules = new Rules()
            validator.validate data, (error) ->
                expect(error.name).to.be 'ValidationExpired'
                done()

    describe 'match', ->
        it 'should throw an error if the data is invalid', ->
            validate =
                title: false
                description: false

            validator = new Validator(validate: validate)
            validator._navigator = new Navigator()
            expect(->
                validator.match title: -> return
            ).to.throwException((e) ->
                expect(e.name).to.be 'IllegalArgument'
            )

        it 'should throw an error if the data is undefined or null', ->
            validator = new Validator(
                validate: {}
                field: true
            )
            expect(->
                validator.match()
            ).to.throwException((e) ->
                expect(e.name).to.be 'IllegalArgument'
            )

        it 'should throw an error if the data is other thing besides a json', ->
            validator = new Validator(
                validate: {}
                field: true
            )
            expect(->
                validator.match -> return
            ).to.throwException((e) ->
                expect(e.name).to.be 'IllegalArgument'
            )

        it 'should return true if the data is according to the validate', ->
            validate =
                string: true
                array: true
                object:
                    object: array: false
                    number: true

            data =
                string: 'string'
                array: [0, 1, 3]
                object:
                    object: array: [0, 1, 2]
                    number: 100

            validator = new Validator(validate: validate)
            expect(validator.match data).to.be.ok()

        it 'should return an error if there is a field that is not specified in the validate', ->
            validate =
                string: false
                array: false
                object:
                    object: false
                    number: false

            data =
                object:
                    iShouldnt: 'beHere'

            validator = new Validator(validate: validate)
            result = validator.match(data)
            expect(result).to.eql
                field: 'object.iShouldnt'
                level: 2
                error: 'denied'

        it 'should return true if the field that would not match has been ignored', ->
            validate =
                string: false
                array: false
                object:
                    sub:
                        object: false
                        number: false

            data =
                object:
                    sub:
                        iShouldnt: 'beHere'

            skipMatch = ['object.sub']

            validator = new Validator(validate: validate, skipMatch: skipMatch)
            result = validator.match(data)
            expect(result).to.be true

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

