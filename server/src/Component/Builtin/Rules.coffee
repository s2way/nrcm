###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

# Dependencies
_ = require 'underscore'
moment = require 'moment'

class Rules

    # Defaults
    @REGEX_EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/
    @REGEX_ALPHANUM_UNDERSCORE: /^[a-zA-Z0-9_]*$/
    @REGEX_DATE: /^\d{4}\-\d{2}\-\d{2}$/
    @REGEX_TIME: /^\d{2}\:\d{2}\:\d{2}$/
    @REGEX_DATETIME: /^\d{4}\-\d{2}\-\d{2}[T]\d{2}\:\d{2}\:\d{2}$/
    @REGEX_ISODATE: /(\d{4})-(\d{2})-(\d{2})T((\d{2}):(\d{2}):(\d{2}))\.(\d{3})Z/
    # Format
    @FORMAT_DATE: 'YYYY-MM-DD'
    @FORMAT_TIME: 'HH:mm:ss'
    @FORMAT_DATETIME: 'YYYY-MM-DDTHH:mm:ss'

    ###
    # TYPE rules
    ###
    @isNumber: (value) ->
        _.isNumber value

    @isInteger: (value) ->
        value % 1 is 0

    @isZero: (value) ->
        value is 0

    @isOne: (value) ->
        value is 1

    @isString: (value) ->
        _.isString value

    @isNull: (value) ->
        _.isNull value

    @isBoolean: (value) ->
        _.isBoolean value

    @isUndefined: (value) ->
        _.isUndefined value

    @notNull: (value) ->
        not Rules.isNull value

    @isArray: (value) ->
        _.isArray value

    @isRegex: (value) ->
        _.isRegExp value

    # GENERIC rules
    @isEmpty: (value) ->
        _.isEmpty value

    @notEmpty: (value) ->
        not Rules.isEmpty value

    @isJSON: (value) ->
        try
            x = JSON.parse JSON.stringify value
            # avoid json like this "full string", null and false from parse
            return false unless _.isObject x
        catch e
            return false
        return true

    ###
    # STRING rules
    ###
    @maxLength: (value, length = 0) ->
        value.length <= length

    @minLength: (value, length = 0) ->
        value.length >= length

    @lengthBetween: (value, min = 0, max = 0) ->
        min <= value.length <= max

    @exactLength: (value, length) ->
        value.length is length

    @regex: (value, regex) ->
        regex.test value

    ###
    # NUMBER rules
    ###
    @max: (value, max) ->
        value <= max
    @min: (value, min) ->
        value >= min

    ###
    # REGEX rules
    ###
    @alphaNumeric: (value) ->
        value.match Rules.REGEX_ALPHANUM_UNDERSCORE

    @email: (value) ->
        value.match Rules.REGEX_EMAIL

    ###
    # DATE and TIME rules
    ###
    @date: (value) ->
        return @regex(value, /^\d{4}\-\d{2}\-\d{2}$/) and moment(value, 'YYYY-MM-DD').isValid()

    @time: (value, formats = ['HH:mm:ss']) ->
        return @regex(value, /^\d{2}\:\d{2}\:\d{2}$/) and moment(value, formats).isValid()

    @datetime: (value, formats = ['YYYY-MM-DDTHH:mm:ss']) ->
        return @regex(value, /^\d{4}\-\d{2}\-\d{2}[T]\d{2}\:\d{2}\:\d{2}$/) and moment(value, formats).isValid()

    @isoDate: (value) ->
        return @regex(value, /(\d{4})-(\d{2})-(\d{2})T((\d{2}):(\d{2}):(\d{2}))\.(\d{3})Z/)

    @isUseful: (value, x) ->
        return false if _.isUndefined(value) or _.isNull(value)
        return value if _.isBoolean value
        return false if _.isObject(value) and _.isEmpty(value)
        return false if (value.length is 0) and (_.isString(value) or _.isArray(value))
        true

module.exports = Rules
