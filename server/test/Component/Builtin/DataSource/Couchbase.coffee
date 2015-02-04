Couchbase = require './../../../../src/Component/Builtin/DataSource/Couchbase'
expect = require 'expect.js'

describe "Couchbase.js", ->

    instance = null
    core = dataSources:
        default:
            host: "127.0.0.1"
            port: 8091
            bucket: "default"
            n1qlHost: "127.0.0.1"
            n1qlPort: 8093
    logger = info: ->
    mockCouchbase =
        Cluster: (cluster) ->
            @openBucket = (bucket) ->
                enableN1ql: (host) ->
            return @

    beforeEach ->
        instance = new Couchbase("default")

    describe "init", ->
        it "should throw an IllegalArgument exception if the data source cannot be found", ->
            instance = new Couchbase("invalid")
            instance.core = dataSources: {}
            instance.logger = logger
            instance._couchbase = mockCouchbase

            expect(->
                instance.init()
            ).to.throwException (e) ->
                expect(e.name).to.be "IllegalArgument"

        it "should initialize the couchbase", ->
            instance = new Couchbase()
            instance.core = core
            instance.logger = logger
            instance._couchbase = mockCouchbase

            expect(->
                instance.init()
            ).to.not.throwException (e) ->
                expect(e).to.not.be.ok()

    describe "destroy", ->
        it "should close the session", ->
            instance = new Couchbase()

            expect(instance.destroy()).to.not.be.ok()
