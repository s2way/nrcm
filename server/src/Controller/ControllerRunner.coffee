Exceptions = require '../Util/Exceptions'

# Responsible for running the controllers
class ControllerRunner
    constructor: (@_logger) ->
        return

    _log: (message) ->
        @_logger?.log?('[ControllerRunner] ' + message)

    # Run the controller calling the corresponding methods and all the triggers (before() and after())
    run: (instance, timeout, callback) ->
        body = null
        timeoutTimer = null
        controllerMethodImmediate = null

        afterCallback = ->
            clearTimeout timeoutTimer
            callback null, body

        controllerMethodCallback = (output) ->
            body = output
            try
                if typeof instance.after is 'function'
                    instance.after afterCallback
                else
                    afterCallback()
            catch e
                clearTimeout timeoutTimer
                callback e

        beforeCallback = ->
            try
                body = instance[instance.method](controllerMethodCallback)
            catch e
                clearTimeout timeoutTimer
                callback e

        # Encapsulate the method in a immediate so it can be killed
        controllerMethodImmediate = setImmediate(->
            try
                if typeof instance.before is 'function'
                    instance.before beforeCallback
                else
                    beforeCallback()
            catch e
                # Catch exceptions that may occur in the controller before method
                clearTimeout timeoutTimer
                callback e
        )

        @_log 'Timeout timer started'
        timeoutTimer = setTimeout( ->
            clearImmediate controllerMethodImmediate
            callback new Exceptions.Timeout()
        , timeout)

module.exports = ControllerRunner