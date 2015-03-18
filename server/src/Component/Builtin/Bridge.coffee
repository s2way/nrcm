Exceptions = require '../../Util/Exceptions'
Router = require '../../Core/Router'

# Create a new bridge to another WaferPie application
# @param {string} bridgeName The name of the bridge configuration (should be located in the core.json)
# @constructor
class Bridge
    constructor: (bridgeName) ->
        @_bridgeName = bridgeName

    # Initialize the bridge and instantiate the Http component
    # Will throw an exception if the bridge cannot be found
    init: ->
        bridge = @core.bridges[@_bridgeName]
        throw new Exceptions.IllegalArgument("Bridge #{@_bridgeName} not found!") unless bridge
        @_app = bridge.app ? false
        urlFormat = bridge.urlFormat ? '/$application/$controller'
        @_router = new Router urlFormat
        @_http = @component 'Http', bridge

    _buildUrl: (controller, options) ->
        url = @_router.compose
            application: @_app
            controller: controller
            segments: options.segments
            query: options.query
            prefixes : options.prefixes
        delete options.query
        url

    get: (controller, options, callback) ->
        @_http.get @_buildUrl(controller, options), options, callback

    put: (controller, options, callback) ->
        @_http.put @_buildUrl(controller, options), options, callback

    delete: (controller, options, callback) ->
        @_http['delete'] @_buildUrl(controller, options), options, callback

    post: (controller, options, callback) ->
        @_http.post @_buildUrl(controller, options), options, callback

module.exports = Bridge