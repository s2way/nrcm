class Exceptions
    @Fatal: (@message = null, @cause = null) ->
        @name = 'Fatal'
        @stack = new Error().stack
    @IllegalArgument: (@message = null, @cause = null) ->
        @name = 'IllegalArgument'
        @stack = new Error().stack
    @ApplicationNotFound: (@message = null, @cause = null) ->
        @name = 'ApplicationNotFound'
    @ControllerNotFound: (@message = null, @cause = null) ->
        @name = 'ControllerNotFound'
    @InvalidUrl: (@message = null, @cause = null) ->
        @name = 'InvalidUrl'
    @InvalidMethod: (@message = null, @cause = null) ->
        @name = 'InvalidMethod'
    @MethodNotFound: (@message = null, @cause = null) ->
        @name = 'MethodNotFound'
    @Timeout: (@message = null, @cause = null) ->
        @name = 'Timeout'
    @OperationInterrupted: (@message = null, @cause = null) ->
        @name = 'OperationInterrupted'
    @IllegalControllerParameter: (@message = null, @cause = null) ->
        @name = 'IllegalControllerParameter'
    @FileNotFound: (@message = null, @cause = null) ->
        @name = 'FileNotFound'
    @DestinationAlreadyExists: (@message = null, @cause = null) ->
        @name = 'DestinationAlreadyExists'

module.exports = Exceptions
