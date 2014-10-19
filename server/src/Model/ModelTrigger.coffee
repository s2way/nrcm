
###*
The ModelTrigger object

@constructor
@method ModelTrigger
@param {function} before The before trigger to execute
@param {function} operation The operation trigger to execute
@param {function} after The after trigger to execute
@param {function} callback
###
ModelTrigger = (before, operation, after, callback) ->
    if typeof before isnt "function"
        before = (beforeCallback) ->
            beforeCallback true
            return
    if typeof after isnt "function"
        after = (afterCallback, err, result) ->
            afterCallback err, result
            return
    if typeof operation isnt "function"
        operation = (err) ->
            callback err
            return
    throw new Exceptions.IllegalArgument("callback is mandatory")  if typeof callback isnt "function"
    @before = before
    @operation = operation
    @after = after
    @callback = callback
    return
Exceptions = require("./../Util/Exceptions")

###*
Execute the triggers, if the operation fails it will not execute the after trigger

@method execute
###
ModelTrigger::execute = ->
    that = this
    @before (continueOperation) ->
        if continueOperation is `undefined` or not continueOperation
            that.callback new Exceptions.OperationInterrupted()
        else
            that.operation (err, result) ->
                if err
                    that.callback err
                else
                    that.after that.callback, err, result
                return

        return

    return

module.exports = ModelTrigger