assert = require("assert")
expect = require("expect.js")
Validator = require("./../../../src/Component/Builtin/Validator")

describe "Validator.js", ->
    describe "validate", ->
        street = "José de Alencar"
        email = "davi@versul.com.br"
        preferences = [
            "Beer"
            "Chips"
        ]
        cpf = "02895328099"
        data =
            cpf: cpf
            "e-mail": email
            password: "123456"
            address:
                street: street
                zipCode: "93310-210"

            preferences: preferences

        it "should validate an empty object and return that it has failed", (done) ->
            validate = undefined
            validator = undefined
            validate = field: (value, fields, callback) ->
                callback {}

            validator = new Validator(validate: validate)
            validator.validate {}, (error) ->
                expect(error.name).to.be "ValidationFailed"
                done()

        it "should execute the validation functions passing each field to be validated", (done) ->
            validate =
                cpf: (value, validationData, callback) ->
                    assert.equal cpf, value
                    assert.equal JSON.stringify(data), JSON.stringify(validationData)
                    callback()

                "e-mail": (value, validationData, callback) ->
                    assert.equal JSON.stringify(data), JSON.stringify(validationData)
                    assert.equal JSON.stringify(value), JSON.stringify(email)
                    callback()

                address:
                    street: (value, validationData, callback) ->
                        assert.equal JSON.stringify(data), JSON.stringify(validationData)
                        assert.equal street, value
                        callback()

                preferences: (value, validationData, callback) ->
                    assert.equal JSON.stringify(data), JSON.stringify(validationData)
                    assert.equal JSON.stringify(value), JSON.stringify(preferences)
                    callback()

            validator = new Validator(
                validate: validate
                timeout: 100
            )
            validator.validate data, (error, validatedFields) ->
                expectedValidatedFields =
                    cpf: true
                    "e-mail": true
                    address:
                        street: true

                    preferences: true

                expect(error).not.to.be.ok()
                expect(JSON.stringify(validatedFields)).to.be JSON.stringify(expectedValidatedFields)
                done()

        it "should return expired as true if the validation functions took too long", (done) ->
            validate =
                cpf: (value, validationData, callback) ->
                    assert.equal cpf, value
                    assert.equal JSON.stringify(data), JSON.stringify(validationData)
                    setTimeout (->
                        callback()
                    ), 10000

                "e-mail": (value, validationData, callback) ->
                    assert.equal email, value
                    assert.equal JSON.stringify(data), JSON.stringify(validationData)
                    callback()

                address:
                    street: (value, validationData, callback) ->
                        assert.equal street, value
                        assert.equal JSON.stringify(data), JSON.stringify(validationData)
                        callback()

                preferences: (value, validationData, callback) ->
                    assert.equal JSON.stringify(preferences), JSON.stringify(value)
                    assert.equal JSON.stringify(data), JSON.stringify(validationData)
                    callback()

            validator = new Validator(
                validate: validate
                timeout: 10
            )
            validator.validate data, (error, validatedFields) ->
                expectedValidatedFields =
                    "e-mail": true
                    address:
                        street: true

                    preferences: true

                expect(error.name).to.be "ValidationExpired"
                expect(JSON.stringify(validatedFields)).to.be JSON.stringify(expectedValidatedFields)
                done()

    describe "match", ->
        it "should throw an error if the data is invalid", ->
            validate =
                title: false
                description: false

            validator = undefined
            try
                validator = new Validator(validate: validate)
            catch e
                assert.fail()
            try
                validator.match title: -> return
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name
            return

        it "should throw an error if the data is undefined or null", ->
            validator = new Validator(
                validate: {}
                field: true
            )
            try
                validator.match()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

        it "should throw an error if the data is other thing besides a json", ->
            validator = new Validator(
                validate: {}
                field: true
            )
            try
                validator.match ->
                    return

                assert.fail()
            catch e
                expect(e.name).to.be "IllegalArgument"

        it "should return true if the data is according to the validate", ->
            validate =
                string: true
                array: true
                object:
                    object:
                        array: false

                    number: true

            data =
                string: "string"
                array: [
                    0
                    1
                    3
                ]
                object:
                    object:
                        array: [
                            0
                            1
                            2
                        ]

                    number: 100

            validator = undefined
            try
                validator = new Validator(validate: validate)
            catch e
                assert.fail()
            assert validator.match(data)

        it "should return an error if there is a missing required field", ->
            validate =
                string: false
                array: true
                object:
                    object:
                        array: false

                    number: false

            data =
                string: "string"
                object:
                    object:
                        array: [
                            0
                            1
                            2
                        ]

                    number: "not_number"

            validator = new Validator(validate: validate)
            result = validator.match(data)
            assert.equal JSON.stringify(
                field: "array"
                level: 1
                error: "required"
            ), JSON.stringify(result)

        it "should return an error if there is a field that is not specified in the validate", ->
            validate =
                string: false
                array: false
                object:
                    object: false
                    number: false

            data = object:
                iShouldnt: "beHere"

            validator = new Validator(validate: validate)
            result = validator.match(data)
            assert.equal JSON.stringify(
                field: "iShouldnt"
                level: 2
                error: "denied"
            ), JSON.stringify(result)
