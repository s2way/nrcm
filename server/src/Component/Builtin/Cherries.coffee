path = require 'path'

# WaferPie utils class
class Cherries

    # Convert a given element name (model, controller, component) to the adequate path
    # @param {string} elementName The name of the element separated by dots (Remote.Model, for example)
    # @returns {string} The equivalent path (Remote/Model)
    elementNameToPath: (elementName) -> elementName.replace /\./g, path.sep

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

module.exports = Cherries