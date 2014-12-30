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

        it "should initialize the couchbase", ->
            instance = new Couchbase()
            instance.core = dataSources:
                default:
                    host: "127.0.0.1"
                    port: 8091
                    bucket: "default"
                    n1qlHost: "127.0.0.1"
                    n1qlPort: 8093
            expect(->
                instance.init()
            ).to.not.throwException (e) ->
                expect(e).to.not.be.ok()

    describe "destroy", ->
        it "should close the session", ->
            instance = new Couchbase()
            instance.core = dataSources:
                default:
                    host: "127.0.0.1"
                    port: 8091
                    bucket: "default"
                    n1qlHost: "127.0.0.1"
                    n1qlPort: 8093

            expect(instance.destroy()).to.not.be.ok()
