Couchbase = require './../../../../src/Component/Builtin/DataSource/Couchbase'
expect = require 'expect.js'

describe "Couchbase.js", ->

    instance = null

    core = dataSources:
        default:
            host: "localhost"
            port: 9000

    logger = info: ->

    beforeEach ->
        instance = new Couchbase("default")
        instance.logger = logger
        instance.core = core

    describe "init", ->
        it "should throw an IllegalArgument exception if the data source cannot be found", ->
            instance = new Couchbase("invalid")
            instance.core = dataSources: {}
            expect(->
                instance.init()
            ).to.throwException (e) ->
                expect(e.name).to.be "IllegalArgument"
