###*
XML Utils
@constructor
###
class XML
    constructor: ->
        @xml2js = require("xml2js")
        @options =
            attrkey: "@"
            charkey: "#"

    ###*
    Convert a JSON object to a XML string
    @param {object} json The JSON object
    @returns {string} The XML String
    ###
    fromJSON: (json) ->
        builder = new @xml2js.Builder(@options)
        xml = builder.buildObject(json)
        xml

    ###*
    Convert a XML string to a JSON object
    @param {string} xml The XML string to be converted
    @returns {json} The JSON converted
    ###
    toJSON: (xml) ->
        json = null
        # This is NOT async!
        parser = new @xml2js.Parser(@options)
        parser.parseString xml, (err, result) ->
            json = result
            throw err if err
            return
        json

module.exports = XML