moment = require 'moment'

class Rules
    # Type validation rules
    isNumber: (value) ->
        return typeof value is 'number' and isFinite value
    isInteger: (value) ->
        return @isNumber(value) and value % 1 is 0
    isZero: (value) ->
        return value is 0
    isOne: (value) ->
        return value is 1
    isString: (value) ->
        return typeof value is 'string'
    isNull: (value) ->
        return value is null
    isBoolean: (value) ->
        return value is true or value is false
    isUndefined: (value) ->
        return value is undefined
    notNull: (value) ->
        return value isnt null

    # String validation rules
    notEmpty: (value) ->
        return @isString(value) and value.length > 0
    maxLength: (value, length = 0) ->
        return @isString(value) and value.length <= length
    minLength: (value, length = 0) ->
        return @isString(value) and value.length >= length
    lengthBetween: (value, min = 0, max = 0) ->
        return @isString(value) and min <= value.length <= max
    regex: (value, regex) ->
        return @isString(value) && regex.test value

    # Number validation rules
    max: (value, max) ->
        return @isNumber(value) && value <= max
    min: (value, min) ->
        return @isNumber(value) && value >= min

    # Other rules
    alphaNumeric: (value, min) ->
        return @regex value, /^[a-zA-Z0-9_]*$/

    # Date/time rules
    date: (value) ->
        return @regex(value, /^\d{4}\-\d{2}\-\d{2}$/) and moment(value, 'YYYY-MM-DD').isValid()
    time: (value, formats = ['HH:mm:ss']) ->
        return @regex(value, /^\d{2}\:\d{2}\:\d{2}$/) and moment(value, formats).isValid()
    datetime: (value, formats = ['YYYY-MM-DDTHH:mm:ss']) ->
        return @regex(value, /^\d{4}\-\d{2}\-\d{2}T\d{2}\-\d{2}\-\d{2}$/) and moment(value, formats).isValid()

module.exports = Rules
