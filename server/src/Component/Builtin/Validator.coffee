Exceptions = require("../../Util/Exceptions")



class Validator
    # @constructor
    # @method Validator
    # @param {object} params Must contain the validation rules (validate property) and may contain the timeout (in millis)
    constructor: (params) ->
        params = params or {}
        @_timeout = params.timeout or 10000
        @_rules = params.validate
        return

    # Validate fields
    _succeeded: (fieldErrors) ->
        key = undefined
        for key of fieldErrors
            if fieldErrors.hasOwnProperty(key)
                if typeof fieldErrors[key] isnt "object"
                    return false  if fieldErrors[key] is false
                else return false  unless @_succeeded(fieldErrors[key])
        true


    # Find all fields to validate
    _hasValidatedAllFields: (fieldErrors, validate) ->
        key = undefined
        for key of validate
            if validate.hasOwnProperty(key)
                if typeof validate[key] isnt "object" or validate[key] instanceof Array
                    return false  if fieldErrors[key] is undefined
                else
                    fieldErrors[key] = {}  if fieldErrors[key] is undefined
                    return false  unless @_hasValidatedAllFields(fieldErrors[key], validate[key])
        true

    _validate: (data, validatedFields, fieldErrors, validate, originalData) ->
        n = undefined
        originalData = originalData or data
        validateFunctionCallback = (validationErrorObject) ->
            fieldErrors[n] = validationErrorObject or true
            validatedFields[n] = (if validationErrorObject then false else true)

        for n of validate
            if validate.hasOwnProperty(n)
                if typeof validate[n] is "function"
                    validate[n] (if data is undefined then undefined else data[n]), originalData, validateFunctionCallback
                else
                    fieldErrors[n] = {}  if fieldErrors[n] is undefined
                    if validate[n] isnt undefined
                        @_validate (if data is undefined then undefined else data[n]), validatedFields, fieldErrors[n], validate[n], originalData


    # Validate all properties of a json
    # @method validate
    # @param {object} data The json object to be validated
    # @param {function} callback
    validate: (data, callback) ->
        validate = @_rules
        fieldErrors = {}
        validatedFields = {}
        that = this
        expired = false
        succeeded = false

        # Fire all validations callbacks
        @_validate data, validatedFields, fieldErrors, validate

        # Start a timer to control validations
        timer = setTimeout(->
            expired = true
            return
        , @_timeout)

        # Timeout
        timeoutFunc = ->
            if expired
                callback
                    name: "ValidationExpired"
                , fieldErrors
            else if that._hasValidatedAllFields(fieldErrors, validate)
                clearTimeout timer
                succeeded = that._succeeded(validatedFields)
                unless succeeded
                    return callback
                        name: "ValidationFailed"
                        fields: fieldErrors
                    , fieldErrors
                callback null, fieldErrors
            else
                setTimeout timeoutFunc, that.timeout / 500

        timeoutFunc()

    _matchAgainst: (data, level, validate) ->
        if level is undefined
            level = 1
            validate = @_rules
        else
            level += 1

        # check schema field presence
        for n of data
            if data.hasOwnProperty(n)

                # schema for this field was not set, block
                if validate[n] is undefined
                    return (
                        field: n
                        level: level
                        error: "denied"
                    )

                # validate set and it is an object: recursive
                if typeof validate[n] is "object"
                    test = @_matchAgainst(data[n], level, validate[n])
                    return test  if test isnt true

        # check for required fields
        for n of validate
            if validate.hasOwnProperty(n)
                if validate[n] is true and data[n] is undefined

                    # required field not present
                    return (
                        field: n
                        level: level
                        error: "required"
                    )
        true

    _isJSONValid: (jsonOb) ->
        newJSON = undefined
        return false  if jsonOb is undefined or jsonOb is null
        try
            newJSON = JSON.parse(JSON.stringify(jsonOb))
        catch e
            return false
        return newJSON if Object.getOwnPropertyNames(newJSON).length > 0
        false


    ###*
    Match the data against the validate object specified in the constructor
    If there are fields in the data that are not specified in the validate object, this method returns false
    @param {object} data The data to be matched
    @return {boolean}
    ###
    match: (data) ->
        newData = @_isJSONValid(data)
        throw new Exceptions.IllegalArgument("The data is invalid!")  unless newData
        @_matchAgainst data

module.exports = Validator