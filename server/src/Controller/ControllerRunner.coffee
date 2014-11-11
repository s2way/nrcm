Exceptions = require '../Util/Exceptions'

# Responsible for running the controllers
class ControllerRunner
    constructor: (@_logger) ->
        return

    _log: (message) ->
        @_logger?.log?('[ControllerRunner] ' + message)

    # Run all filter's before() method
    # If a response is issued by one of the before()'s, the response is passed to the second argument of the callback
    # If no response is issued by one of the before()'s, true is passed to the second argument of the callback
    _runFiltersBefore: (controller, timeoutTimer, callback) ->
        filters = controller.filters.slice 0

        pickFilterAndCallBefore = () ->
            noFiltersLeft = filters.length is 0
            return callback null, true if noFiltersLeft

            filter = filters.shift()

            try
                if typeof filter.before is 'function'
                    filter.before((response) ->
                        isCarryOnResponse = response is true or response is undefined
                        if isCarryOnResponse
                            pickFilterAndCallBefore()
                        else
                            clearTimeout timeoutTimer
                            controller.statusCode = filter.statusCode if filter.statusCode?
                            controller.responseHeaders = filter.responseHeaders if filter.responseHeaders?
                            callback null, response
                    )
                else
                    pickFilterAndCallBefore()
            catch e
                clearTimeout timeoutTimer
                callback e

        pickFilterAndCallBefore()

    # Run all filter's after() method in reverse order
    _runFiltersAfter: (controller, timeoutTimer, callback) ->
        filtersInReverseOrder = controller.filters.reverse().slice 0
        pickFilterAndCallAfter = () ->
            noFiltersLeft = filtersInReverseOrder.length is 0
            return callback null if noFiltersLeft

            filter = filtersInReverseOrder.shift()
            try
                if typeof filter.after is 'function'
                    filter.after(pickFilterAndCallAfter)
                else
                    pickFilterAndCallAfter()
            catch e
                clearTimeout timeoutTimer
                callback e

        pickFilterAndCallAfter()


    # Run the controller calling the corresponding methods and all the triggers (before() and after())
    run: (controller, timeout, callback) ->
        body = null
        timeoutTimer = null
        controllerMethodImmediate = null

        afterCallback = =>
            @_runFiltersAfter controller, timeoutTimer, (error) ->
                clearTimeout timeoutTimer
                return callback error if error
                return callback null, body

        controllerMethodCallback = (output) ->
            body = output
            try
                if typeof controller.after is 'function'
                    controller.after afterCallback
                else
                    afterCallback()
            catch e
                clearTimeout timeoutTimer
                callback e

        beforeCallback = (response) ->
            try
                if response is true or response is undefined
                    body = controller[controller.method](controllerMethodCallback)
                else
                    clearTimeout timeoutTimer
                    callback null, response
            catch e
                clearTimeout timeoutTimer
                callback e

        @_log 'Timeout timer started'
        timeoutTimer = setTimeout( ->
            clearImmediate controllerMethodImmediate
            callback new Exceptions.Timeout()
        , timeout)

        # Encapsulate the method in a immediate so it can be killed
        controllerMethodImmediate = setImmediate(=>
            @_runFiltersBefore controller, timeoutTimer, (error, callbackResponse) ->
                return callback(error) if error
                return callback(null, callbackResponse) if callbackResponse isnt true

                try
                    if typeof controller.before is 'function'
                        controller.before beforeCallback
                    else
                        beforeCallback()
                catch e
                    # Catch exceptions that may occur in the controller before method
                    clearTimeout timeoutTimer
                    callback e
        )

module.exports = ControllerRunner