path = require 'path'
Sync = require '../../Util/Sync'

# WaferPie utils class
class Cherries

    # Convert a given element name (model, controller, component) to the adequate path
    # @param {string} elementName The name of the element separated by dots (Remote.Model, for example)
    # @returns {string} The equivalent path (Remote/Model)
    elementNameToPath: (elementName) ->
        elementName.replace /\./g, path.sep

    # Convert a given relative path (model, controller, component) to the adequate element
    # @param {string} relativePath The path of the element (Remote/Model, for example)
    # @returns {string} The equivalent element name (Remote.Model)
    pathToElementName: (relativePath) ->
        relativePath = relativePath.replace '.coffee', ''
        relativePath = relativePath.replace '.js', ''
        relativePath.replace new RegExp('\\' + path.sep, 'g'), '.'

    # Perform a deep copy of an object
    # Removes unserializable properties (functions, for example)
    # @param {object} object The object to be copied
    # @returns {*}
    copy: (object) -> JSON.parse JSON.stringify(object)

    # Checks if an object is a valid JSON
    isJSON: (object) ->
        return false if typeof object isnt 'object' or object is null
        try
            JSON.parse(JSON.stringify(object))
        catch e
            return false
        true

    # Load builtin and application components
    # @param {string} componentsPath Path to the application components
    # @returns {object} Components
    # @private
    loadComponents: (componentsPath) ->
        components = @loadBuiltinComponents()
        appComponents = @loadElements(componentsPath)
        for componentName of appComponents
            components[componentName] = appComponents[componentName] if appComponents.hasOwnProperty(componentName)
        components

    # Loads and returns all builtin components
    loadBuiltinComponents: ->
        @loadElements(path.resolve(__dirname))

    # Load all elements from a given directory
    loadElements: (dirPath) ->
        elementNames = []
        files = Sync.listFilesFromDir(dirPath)
        files.forEach (file) ->
            relative = file.substring(dirPath.length + 1)
            extensionIndex = relative.lastIndexOf('.')
            relativeWithoutExt = relative.substring(0, extensionIndex)
            elementName = relativeWithoutExt.replace(/\//g, '.')
            elementNames[elementName] = file

        Sync.loadNodeFilesIntoArray elementNames

module.exports = Cherries