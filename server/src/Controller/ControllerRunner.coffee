Exceptions = require '../Util/Exceptions'
util = require 'util'
domain = require 'domain'
Cherries = require '../Component/Builtin/Cherries'

# Responsible for running the controllers
class ControllerRunner
    constructor: (@_logger) ->
        @_cherries = new Cherries
        return

    _error: (object) ->
        @_logger?.error?("Error: #{JSON.stringify(object)}")

    # Run all filter's before() method
    # If a response is issued by one of the before()'s, the response is passed to the second argument of the callback
    # If no response is issued by one of the before()'s, true is passed to the second argument of the callback
    _runFiltersBefore: (controller, timeoutTimer, callback) ->
        filters = controller.filters.slice 0

        pickFilterAndCallBefore = =>
            noFiltersLeft = filters.length is 0
            return callback null, true if noFiltersLeft

            filter = filters.shift()

            beforeDomain = domain.create()
            beforeDomain.on 'error', (e) =>
                # Filter.before() exception
                clearTimeout timeoutTimer
                @_onError e, controller, callback

            beforeDomain.run ->
                filter.processed = true

                if typeof filter.before is 'function'
                    filter.before.called = true
                    filter.before((response) ->
                        beforeDomain.exit()
                        isCarryOnResponse = response is true or response is undefined
                        if isCarryOnResponse
                            pickFilterAndCallBefore()
                        else
                            clearTimeout timeoutTimer
                            controller.responseHeaders = filter.responseHeaders if filter.responseHeaders?
                            callback null, response
                    )
                else
                    beforeDomain.exit()
                    pickFilterAndCallBefore()

        pickFilterAndCallBefore()

    # Run all filter's after() method in reverse order
    _runFiltersAfter: (controller, timeoutTimer, callback) ->
        filtersInReverseOrder = controller.filters.reverse().slice 0
        pickFilterAndCallAfter = =>
            noFiltersLeft = filtersInReverseOrder.length is 0
            return callback null if noFiltersLeft

            filter = filtersInReverseOrder.shift()

            # Injects the body into the filter so it will be avaible in the after method
            filter.body = @body
            filter.statusCode = controller.statusCode
            afterDomain = domain.create()
            afterDomain.on 'error', (e) =>
                # Filter.after() exception
                clearTimeout timeoutTimer
                @_onError e, controller, callback

            afterDomain.run ->
                if typeof filter.after is 'function'
                    filter.after.called = true
                    filter.after(->
                        # Overrides the body so the 'after method' changes can take effect
                        @body = filter.body
                        afterDomain.exit()
                        pickFilterAndCallAfter()
                    )
                else
                    afterDomain.exit()
                    pickFilterAndCallAfter()

        pickFilterAndCallAfter()

    # Run all filter's afterX() method in reverse order
    _runFiltersAfterX: (which, controller, callback) ->
        filtersInReverseOrder = controller.filters.reverse().slice 0
        pickFilterAndCallMethod = ->
            noFiltersLeft = filtersInReverseOrder.length is 0
            return callback null if noFiltersLeft

            filter = filtersInReverseOrder.shift()
            afterXDomain = domain.create()
            afterXDomain.on 'error', (e) ->
                # Filter.afterTimeout() or Controller.afterError() exception
                # DO NOT CALL _onError() OR IT WILL RESULT IN AN INFINITE LOOP
                callback e

            # Injects the body into the filter so it will be avaible in the after method
            filter.body = @body
            filter.statusCode = controller.statusCode
            afterXDomain.run ->
                wasFilterProcessed = filter.processed is true
                if typeof filter[which] is 'function' and wasFilterProcessed
                    filter[which].called = true
                    filter[which](->
                        # Overrides the body so the 'after method' changes can take effect
                        @body = filter.body
                        afterXDomain.exit()
                        pickFilterAndCallMethod()
                    )
                else
                    afterXDomain.exit()
                    pickFilterAndCallMethod()

        pickFilterAndCallMethod()


    # Executed if an exception occurs inside
    # Controller.before(), Controller.method(), Controller.after()
    _onError: (error, controller, callback) ->
        callback error
        @_runFiltersAfterX 'afterError', controller, (errorWithinAfterError) =>
            # If an error occurs within afterError(), only the original error will be sent to the client
            @_error(errorWithinAfterError) if errorWithinAfterError

    # Run the controller calling the corresponding methods and all the triggers (before() and after())
    run: (controller, timeout, callback) ->
        timeoutTimer = null
        controllerMethodImmediate = null

        afterCallback = =>
            @_runFiltersAfter controller, timeoutTimer, (error) =>
                clearTimeout timeoutTimer
                return callback error if error
                return callback null, @body

        controllerMethodCallback = (output) =>
            @body = output
            # Injects the body into the controller so it will be avaible in the after method
            controller.body = @body

            afterDomain = domain.create()
            afterDomain.on 'error', (e) =>
                # controller.after() exception
                clearTimeout timeoutTimer
                @_onError e, controller, callback
                afterDomain.dispose()

            afterDomain.run ->
                if typeof controller.after is 'function'
                    controller.after.called = true
                    controller.after(->
                        # Overrides the body so the 'after method' changes to it can take effect
                        @body = controller.body
                        @statusCode = controller.statusCode
                        afterDomain.exit()
                        afterCallback()
                    )
                else
                    afterDomain.exit()
                    afterCallback()

        beforeCallback = (response) =>
            methodDomain = domain.create()
            methodDomain.on 'error', (e) =>
                # controller.method() exception
                clearTimeout timeoutTimer
                @_onError e, controller, callback
                methodDomain.dispose()

            methodDomain.run =>
                if response is true or response is undefined
                    controller[controller.method]((response) =>
                        if @_cherries.isJSON response
                            controller.responseBody = @_cherries.copy(response)
                        else
                            controller.responseBody = response
                        methodDomain.exit()
                        controllerMethodCallback(response)
                    )
                    controller[controller.method].called = true
                else
                    methodDomain.exit()
                    clearTimeout timeoutTimer
                    callback null, response

        timeoutTimer = setTimeout( =>
            callback new Exceptions.Timeout() # Response already sent

            controllerTimeoutCallback = =>
                @_runFiltersAfterX 'afterTimeout', controller, (error) =>
                    @_error(error) if error

            wasControllerCalled = controller.before?.called is true or controller[controller.method].called is true
            if typeof controller.afterTimeout is 'function' and wasControllerCalled
                controller.afterTimeout controllerTimeoutCallback
            else
                controllerTimeoutCallback()

        , timeout)

        setImmediate(=>
            @_runFiltersBefore controller, timeoutTimer, (error, callbackResponse) =>
                return callback(error) if error
                return callback(null, callbackResponse) if callbackResponse isnt true

                beforeDomain = domain.create()
                beforeDomain.on 'error', (e) =>
                    # controller.before() exception
                    clearTimeout timeoutTimer
                    @_onError e, controller, callback
                    beforeDomain.dispose()

                beforeDomain.run ->
                    if typeof controller.before is 'function'
                        controller.before.called = true
                        controller.before((response) ->
                            beforeDomain.exit()
                            beforeCallback response
                        )
                    else
                        beforeDomain.exit()
                        beforeCallback()
        )

module.exports = ControllerRunner