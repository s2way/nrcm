Exceptions = require("../../Util/Exceptions")

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
        throw new Exceptions.IllegalArgument("Bridge " + @_bridgeName + " not found!")  unless bridge
        @_app = bridge.app or false
        @_http = @component("Http", bridge)

    _insertApp: (resource) ->
        newResource = ""
        newResource += "/"  if resource.charAt(0) isnt "/"
        newResource += @_app + "/"  if @_app
        newResource + resource

    get: (resource, options, callback) ->
        @_http.get @_insertApp(resource), options, callback

    put: (resource, options, callback) ->
        @_http.put @_insertApp(resource), options, callback

    delete: (resource, options, callback) ->
        @_http["delete"] @_insertApp(resource), options, callback

    post: (resource, options, callback) ->
        @_http.post @_insertApp(resource), options, callback

module.exports = Bridge