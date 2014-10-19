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

    describe "connect", ->
        it "should return the bucket object", (done) ->
            bucket = on: (what, callback) ->
                callback null, bucket  if what is "connect"

            instance = new Couchbase()
            instance.core = core
            instance.logger = logger
            instance.init()
            instance._couchbase = Cluster: ->
                openBucket: ->
                    bucket

            instance.connect (error, b) ->
                expect(b).to.be bucket
                done()

    it "should pass an error to the callback if an error occurs", (done) ->
        bucket = on: (what, callback) ->
            callback {}  if what is "error"

        instance = new Couchbase()
        instance.core = core
        instance.logger = logger
        instance.init()
        instance._couchbase = Cluster: ->
            openBucket: ->
                bucket

        instance.connect (error) ->
            expect(error).to.ok()
            done()
