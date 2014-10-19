expect = require 'expect.js'
XML = require './../../../src/Component/Builtin/XML'

describe "XML.js", ->
    instance = new XML()
    json = root:
        child: [
            "#": "Some text."
            "@":
                attribute: "value"
        ]

    xml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<root>\n  <child attribute=\"value\">Some text.</child>\n</root>"
    describe "fromJSON", ->
        it "should convert the JSON to a XML", (done) ->
            expect(instance.fromJSON(json)).to.be xml
            done()

    describe "toJSON", ->
        it "should convert the XML to a JSON", (done) ->
            expect(JSON.stringify(instance.toJSON(xml))).to.be JSON.stringify(json)
            done()
