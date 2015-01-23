domain = require 'domain'

class ElementManager

    # Responsible for creating components and models
    # @param application The application object
    # @constructor
    constructor: (@_application) ->
        @_models = []
        @_dynamicComponents = []
        @_staticComponents = {}

    # Return all components instantiated by this factory (both dynamic and static)
    # @returns {{}|*}
    _getComponents: ->
        instances = []
        @_dynamicComponents.forEach (instance) -> instances.push instance
        for componentName of @_staticComponents
            instances.push @_staticComponents[componentName] if @_staticComponents.hasOwnProperty(componentName)
        instances

    # Destroys all loaded component
    # The destruction of the components is asynchronous
    # @param {function} Will call this callback every time an exception occurs in a destroy method
    destroy: (onError) ->
        componentsCreated = @_getComponents()
        destroyDomain = domain.create()
        destroyDomain.run ->
            for componentInstance in componentsCreated
                destroyComponent = (componentInstance) ->
                    componentInstance.destroy?()
                setImmediate destroyComponent, componentInstance
        destroyDomain.on 'error', (e) ->
            onError?(e)

    # Instantiate a component (builtin or application)
    # @param {string} type Element type: 'component' or 'model'
    # @param {string} componentName The name of the component to be instantiated. If there are folder, they must be separated by dot.
    # @param {object=} params Parameters passed to the component constructor
    # @returns {object} The component instantiated or null if it does not exist
    create: (type, elementName, params) ->
        ElementConstructor = null
        if type is 'model' and @_application.models[elementName] isnt undefined
            ElementConstructor = @_application.models[elementName]
        else if type is 'component' and @_application.components[elementName] isnt undefined
            ElementConstructor = @_application.components[elementName]
        else
            return null

        if type is 'component'
            if ElementConstructor.static is true
                alreadyInstantiated = @_staticComponents[elementName] isnt undefined
                return @_staticComponents[elementName] if alreadyInstantiated

        elementInstance = new ElementConstructor(params)
        elementInstance.name = elementName
        elementInstance.constants = @_application.constants
        elementInstance.model = (modelName, params) =>
            instance = @create('model', modelName, params)
            @init instance
            instance

        elementInstance.component = (componentName, params) =>
            instance = @create('component', componentName, params)
            @init instance
            instance

        elementInstance.core = @_application.core
        elementInstance.configs = @_application.configs

        # Call the inject method (if specified) to perform additional injections into the element (component or model)
        @inject?(elementName, type, elementInstance)

        if type is 'component'
            if ElementConstructor.static is true
                @_staticComponents[elementName] = elementInstance
            else
                @_dynamicComponents.push elementInstance
        else
            @_models.push elementInstance
        elementInstance

    # Calls the component init() method if defined
    # @param {object} componentInstance The component instance
    init: (elementInstance) ->
        if elementInstance isnt null
            elementInstance.init?()
        elementInstance

module.exports = ElementManager
