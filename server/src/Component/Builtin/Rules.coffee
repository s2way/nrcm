###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

_ = require 'underscore'
moment = require 'moment'
Exceptions = require '../../Util/Exceptions'

emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/

class Rules
    @static = true
    # Type validation rules
    isNumber: (value) ->
        typeof value is 'number' and isFinite value
    isInteger: (value) ->
        @isNumber(value) and value % 1 is 0
    isZero: (value) ->
        value is 0
    isOne: (value) ->
        value is 1
    isString: (value) ->
        typeof value is 'string'
    isNull: (value) ->
        value is null
    isBoolean: (value) ->
        value is true or value is false
    isUndefined: (value) ->
        value is undefined
    notNull: (value) ->
        value isnt null
    isArray: (value) ->
        Array.isArray(value)

    # String validation rules
    notEmpty: (value) ->
        @isString(value) and value.length > 0
    maxLength: (value, length = 0) ->
        @isString(value) and value.length <= length
    minLength: (value, length = 0) ->
        @isString(value) and value.length >= length
    lengthBetween: (value, min = 0, max = 0) ->
        @isString(value) and min <= value.length <= max
    exactLength: (value, length) ->
        @isString(value) and value.length is length
    regex: (value, regex) ->
        @isString(value) && regex.test value

    # Number validation rules
    max: (value, max) ->
        return @isNumber(value) && value <= max
    min: (value, min) ->
        return @isNumber(value) && value >= min

    # Other rules
    alphaNumeric: (value) ->
        return @regex value, /^[a-zA-Z0-9_]*$/
    email: (value) ->
        return @regex value, emailRegex

    # Date/time rules
    date: (value) ->
        return @regex(value, /^\d{4}\-\d{2}\-\d{2}$/) and moment(value, 'YYYY-MM-DD').isValid()
    time: (value, formats = ['HH:mm:ss']) ->
        return @regex(value, /^\d{2}\:\d{2}\:\d{2}$/) and moment(value, formats).isValid()
    datetime: (value, formats = ['YYYY-MM-DDTHH:mm:ss']) ->
        return @regex(value, /^\d{4}\-\d{2}\-\d{2}[T]\d{2}\:\d{2}\:\d{2}$/) and moment(value, formats).isValid()
    isoDate: (value) ->
        return @regex(value, /(\d{4})-(\d{2})-(\d{2})T((\d{2}):(\d{2}):(\d{2}))\.(\d{3})Z/)

    isUseful: (value) ->
        if _.isUndefined(value) || _.isNull(value)
            return false
        if _.isBoolean(value)
            return value
        if _.isObject(value) && _.isEmpty(value)
            return false
        if (_.isString(value) || _.isArray(value)) && (value.length == 0)
            return false
        return true

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


module.exports = Rules
