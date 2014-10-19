class Exceptions
    @Fatal: (message, cause) ->
        @name = 'Fatal'
        @cause = cause
        @message = message
        @stack = new Error().stack
    @ApplicationNotFound: (message, cause) ->
        @name = 'ApplicationNotFound'
        @cause = cause
        @message = message
    @ControllerNotFound: (message, cause) ->
        @name = 'ControllerNotFound'
        @cause = cause
        @message = message
    @InvalidUrl: (message, cause) ->
        @name = 'InvalidUrl'
        @cause = cause
        @message = message
    @InvalidMethod: (message, cause) ->
        @name = 'InvalidMethod'
        @cause = cause
        @message = message
    @MethodNotFound: (message, cause) ->
        @name = 'MethodNotFound'
        @cause = cause
        @message = message
    @Timeout: (message, cause) ->
        @name = 'Timeout'
        @cause = cause
        @message = message
    @IllegalArgument: (message) ->
        @name = 'IllegalArgument'
        @message = message
    @OperationInterrupted: (message) ->
        @name = 'OperationInterrupted'
        @message = message

module.exports = Exceptions