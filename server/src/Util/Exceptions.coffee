###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

class Exceptions

    # Defaults
    @ERROR_FATAL: 'Fatal'
    @ERROR_ILEGAL_ARG: 'IlegalArgument'
    @ERROR_APP_NOT_FOUND: 'ApplicationNotFound'
    @ERROR_CONTROLLER_PARAMETER: 'IlegalControllerParameter'
    @ERROR_CONTROLLER_NOT_FOUND: 'ControllerNotFound'
    @ERROR_INVALID_URL: 'InvalidUrl'
    @ERROR_METHOD_NOT_FOUND: 'MethodNotFound'
    @ERROR_INVALID_METHOD: 'InvalidMethod'
    @ERROR_TIMEOUT: 'Timeout'
    @ERROR_OPERATION_INTERRUPTED: 'OperationInterrupted'
    @ERROR_FILE_NOT_FOUND: 'FileNotFound'
    @ERROR_DESTINATION_EXISTS: 'DestinationAlreadyExists'

    @Fatal: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_FATAL
        @stack = new Error().stack
    @IllegalArgument: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_ILEGAL_ARG
        @stack = new Error().stack
    @ApplicationNotFound: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_APP_NOT_FOUND
    @ControllerNotFound: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_CONTROLLER_NOT_FOUND
    @InvalidUrl: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_INVALID_URL
    @InvalidMethod: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_INVALID_METHOD
    @MethodNotFound: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_METHOD_NOT_FOUND
    @Timeout: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_TIMEOUT
    @OperationInterrupted: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_OPERATION_INTERRUPTED
    @IllegalControllerParameter: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_CONTROLLER_PARAMETER
    @FileNotFound: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_FILE_NOT_FOUND
    @DestinationAlreadyExists: (@message = null, @cause = null) ->
        @name = Exceptions.ERROR_DESTINATION_EXISTS

module.exports = Exceptions
