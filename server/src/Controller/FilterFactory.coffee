# Responsible for creating all filters based on a controller instance
class FilterFactory
    constructor: (@_application, @_elementManager, @_logger) ->
        return

    # Creates an instance of each filter declared in the @_application object and performs injection based
    # on the given controller instance
    createForController: (controllerInstance) ->
        filters = []
        for filterName of @_application.filters
            filters.push @_create(filterName, controllerInstance)
        controllerInstance.filters = filters
        filters

    # Creates an instance of a given filter and copy most properties from the controllerInstance
    _create: (filterName, controllerInstance) ->
        filterInstance = new @_application.filters[filterName]
        filterInstance.segments = controllerInstance.segments
        filterInstance.query = controllerInstance.query
        filterInstance.prefixes = controllerInstance.prefixes
        filterInstance.method = controllerInstance.method
        filterInstance.url = controllerInstance.url
        filterInstance.payload = controllerInstance.payload
        filterInstance.responseHeaders = {}
        filterInstance.requestHeaders = controllerInstance.requestHeaders
        filterInstance.core = controllerInstance.core
        filterInstance.configs = controllerInstance.configs
        filterInstance.controller = controllerInstance.name
        filterInstance.component = (modelName, params) =>
            instance = @_elementManager.create 'component', modelName, params
            @_elementManager.init instance
            instance

        filterInstance.model = (componentName, params) =>
            instance = @_elementManager.create 'model', componentName, params
            @_elementManager.init instance
            instance

        filterInstance.name = filterName
        filterInstance.params = controllerInstance.params
        @inject?(filterInstance)
        filterInstance

module.exports = FilterFactory
