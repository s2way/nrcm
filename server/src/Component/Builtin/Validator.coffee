###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

Exceptions = require('../../Util/Exceptions')

class Validator
    # @constructor
    # @method Validator
    # @param {object} params Must contain the validation rules (validate property) and may contain the timeout (in millis)
    constructor: (params = {}) ->
        @_timeout = params.timeout ? 10000
        @_validationObject = params.validate
        @_skipMatch = params.skipMatch ? []

    init: ->
        @_rules = @component 'Rules'
        @_navigator = @component 'Navigator'

    # Validate fields
    _succeeded: (fieldErrors) ->
        for expression of fieldErrors
            return false if fieldErrors[expression]?
        true

    # Find all fields to validate
    _hasValidatedAllFields: (validatedFields, validate) ->
        for expression of validate
            return false unless validatedFields[expression]?
        true

    # Validate all properties of a json
    # @method validate
    # @param {object} data The json object to be validated
    # @param {function} callback
    validate: (data, callback) ->
        validate = @_validationObject
        fieldErrors = {}
        validatedFields = {}
        expired = false
        succeeded = false

        for expression of validate
            fieldRule = validate[expression]

            value = @_navigator.get data, expression

            if typeof fieldRule is 'function'
                fieldRule(value, data,
                    ((expression) ->
                        return (error) ->
                            validatedFields[expression] = true
                            fieldErrors[expression] = error if error
                    )(expression)
                )
            else
                result = @_rules.test(value, fieldRule)
                fieldErrors[expression] = result if result
                validatedFields[expression] = true

        # Start a timer to control validations
        timer = setTimeout(->
            expired = true
        , @_timeout)

        timeoutFunc = =>
            if expired
                callback
                    name: 'ValidationExpired'
                , validatedFields, fieldErrors
            else if @_hasValidatedAllFields(validatedFields, validate)
                clearTimeout timer
                succeeded = @_succeeded(fieldErrors)
                unless succeeded
                    return callback
                        name: 'ValidationFailed'
                        fields: fieldErrors
                    , validatedFields, fieldErrors
                callback null, validatedFields, fieldErrors
            else
                setTimeout timeoutFunc, @timeout / 500

        timeoutFunc()

    _matchAgainst: (data, skipMatch = @_skipMatch, level = 1, validate = @_validationObject, expression = '') ->

        # check schema field presence
        for key of data
            # if field must not be ignored
            if (expression + key) in skipMatch
                continue
            # schema for this field was not set, block
            if validate[expression + key] is undefined
                return (
                    field: expression + key
                    level: level
                    error: 'denied'
                )

            # validate set and it is an object: recursive
            if data[key] isnt null and typeof data[key] is 'object'
                test = @_matchAgainst(data[key], skipMatch, level + 1, validate[expression + key], expression + key + '.')
                return test if test isnt true
        true

    _isJSONValid: (jsonOb) ->
        return false unless jsonOb?
        try
            newJSON = JSON.parse(JSON.stringify(jsonOb))
        catch e
            return false
        return newJSON if Object.getOwnPropertyNames(newJSON).length > 0
        false


    # Match the data against the validate object specified in the constructor
    # If there are fields in the data that are not specified in the validate object, this method returns false
    # @param {object} data The data to be matched
    # @return {boolean}
    match: (data) ->
        newData = @_isJSONValid(data)
        throw new Exceptions.IllegalArgument('The data is invalid!') unless newData
        @_matchAgainst data

    # Test if a value will pass a set of validation rules specified in the rules parameter
    # @value The value to be validated
    # @rules {object} A JSON containing the rules to be tested against the fields
    # See the tests for examples
    test: (value, rules) ->
        failureCounter = 0
        failedRules = {}
        for key of rules
            rule = rules[key]
            rule = {} unless rule?
            ruleMethod = rule.rule ? key
            ruleMethodParams = rule.params
            required = rule.required ? false
            ruleExists = @[ruleMethod]?
            throw new Exceptions.IllegalArgument "Rule #{ruleMethod} not found" unless ruleExists
            if required is false and value is undefined
                passed = true
            else
                passed = @[ruleMethod].apply(@, [value].concat ruleMethodParams)
            unless passed
                failedRules[key] = rule
                failureCounter += 1

        return null if failureCounter is 0
        return failedRules

module.exports = Validator
