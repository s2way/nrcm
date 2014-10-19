ElasticSearch = require './../../../../src/Component/Builtin/DataSource/ElasticSearch'
expect = require 'expect.js'

describe "ElasticSearch.js", ->

    instance = null

    beforeEach ->
        instance = new ElasticSearch("default")
        instance.logger = info: ->

        instance.core = dataSources:
            default:
                host: "localhost"
                port: 9000

    describe "client", ->
        it "should return the elasticsearch client", ->
            expect(instance.client()).to.be.ok()

        it "should throw an IllegalArgument exception if the DataSource config cannot be found", ->
            instance._elasticsearch = Client: (parameters) ->
                expect(parameters.host).to.be "localhost:9000"

            expect(->
                instance.client "invalid"
            ).to.throwException (e) ->
                expect(e.name).to.be "IllegalArgument"
