ElasticSearch = require './../../../../src/Component/Builtin/DataSource/ElasticSearch'
expect = require 'expect.js'
ejs = require 'elastic.js'

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

        it 'should set the request timeout to the specified value', ->

            timeout = 1000
            instance.core.dataSources.default.timeout = timeout
            esClient = instance.client()
            expect(esClient.transport._config.requestTimeout).to.eql timeout

        it 'should default the request timeout if none is passed', ->

            defaultTimeout = 30000
            esClient = instance.client()
            expect(esClient.transport._config.requestTimeout).to.eql defaultTimeout

    describe "query", ->

        it "should query for all types if none is specified in params", ->

            expectedResponse = {}

            instance.client = (config) ->
                client = ()->
                    search: (options)->
                        expect(options.type).not.to.be.ok()
                        @
                    then: (success, error) ->
                new client()

            params =
                index: 'test'

            instance.query '', params, null

        it "should query for all indexes if none is specified in params", ->

            expectedResponse = {}

            instance.client = (config) ->
                client = ()->
                    search: (options)->
                        expect(options.index).not.to.be.ok()
                        @
                    then: (success, error) ->
                new client()

            params = {}

            instance.query '', params, null

        it "should return the response from the server if nothing went wrong", ->

            expectedResponse =
                hits: {
                    plate: 'aaa',
                    spot: '1'
                }

            instance.client = (config) ->
                client = ()->
                    search: (options)->
                        @
                    then: (success, error) ->
                        response =
                            hits: {
                                plate: 'aaa',
                                spot: '1'
                            }
                        success response
                new client()

            callback = (err, resp) ->
                expect(err).not.to.be.ok()
                expect(resp).to.be.ok()
                expect(resp).to.eql expectedResponse

            instance.query '', null, callback

        it "should return an error if something went wrong", ->

            expectedResponse =
                error: 'Error.'

            instance.client = (config) ->
                client = ()->
                    search: (options)->
                        @
                    then: (success, error) ->
                        errorMsg =
                            error: 'Error.'
                        error errorMsg
                new client()

            callback = (err, resp) ->
                expect(resp).not.to.be.ok()
                expect(err).to.be.ok()
                expect(err).to.eql expectedResponse

            instance.query '', null, callback

    describe 'scroll', ->

        it 'should return an error if something bad happened', (done) ->

            expectedError = 'System failure'
            params =
                scrollId: 'default'
                scroll: 'test'

            instance.client = (config) ->
                scroll: (options, callback) ->
                    expect(params).to.eql options
                    callback expectedError

            instance.scroll 'default', params, (err, response) ->
                expect(err).to.eql expectedError
                expect(response).to.be undefined
                done()

        it 'should return the document if found', (done) ->

            expectedResponse =
                this : 'is'
                a : 'document'

            params =
                scrollId: 'default'
                scroll: 'test'

            instance.client = (config) ->
                scroll: (options, callback) ->
                    expect(params).to.eql options
                    callback null, expectedResponse

            instance.scroll 'default', params, (err, response) ->
                expect(err).to.be null
                expect(response).to.eql expectedResponse
                done()

    describe 'get', ->

        it 'should return an error if something bad happened', (done) ->

            expectedError = 'System failure'
            params =
                index: 'default'
                type: 'test'
                id: 1

            instance.client = (config) ->
                get: (options, callback) ->
                    expect(params).to.eql options
                    callback expectedError

            instance.get 'default', params, (err, response) ->
                expect(err).to.eql expectedError
                expect(response).to.be undefined
                done()

        it 'should return the document if found', (done) ->

            expectedResponse =
                this : 'is'
                a : 'document'

            params =
                index: 'default'
                type: 'test'
                id: 1

            instance.client = (config) ->
                get: (options, callback) ->
                    expect(params).to.eql options
                    callback null, expectedResponse

            instance.get 'default', params, (err, response) ->
                expect(err).to.be null
                expect(response).to.eql expectedResponse
                done()

    describe 'save', ->

        it 'should return an error if something bad happened', (done) ->

            expectedError = 'System failure'
            params =
                index: 'default'
                type: 'test'
                data:
                    random : 'document'

            instance.client = (config) ->
                index: (options, callback) ->
                    expected =
                        index: 'default'
                        type: 'test'
                        body:
                            random : 'document'
                    expect(options).to.eql expected
                    callback expectedError

            instance.save 'default', params, (err, response) ->
                expect(err).to.eql expectedError
                expect(response).to.be undefined
                done()

        it 'should add the id to the save params if it was passed', (done) ->

            expectedError = 'System failure'
            params =
                index: 'default'
                type: 'test'
                id: 1
                data:
                    random : 'document'

            instance.client = (config) ->
                index: (options, callback) ->
                    expected =
                        index: 'default'
                        type: 'test'
                        id : 1
                        body:
                            random : 'document'
                    expect(options).to.eql expected
                    callback expectedError

            instance.save 'default', params, ->
                done()

        it 'should return the document if found', (done) ->

            expectedResponse =
                this : 'is'
                a : 'save confirmation'

            params =
                index: 'default'
                type: 'test'
                data:
                    random : 'document'

            instance.client = (config) ->
                index: (options, callback) ->
                    expected =
                        index: 'default'
                        type: 'test'
                        body:
                            random : 'document'
                    expect(options).to.eql expected
                    callback null, expectedResponse

            instance.save 'default', params, (err, response) ->
                expect(err).to.be null
                expect(response).to.eql expectedResponse
                done()

    describe 'create', ->

        it 'should return an error if something bad happened', (done) ->

            expectedError = 'System failure'

            params =
                index: 'default'
                type: 'test'
                id: 1
                data:
                    random : 'document'

            instance.client = (config) ->
                create: (options, callback) ->
                    expected =
                        index: 'default'
                        type: 'test'
                        id: 1
                        body:
                            random : 'document'
                    expect(expected).to.eql options
                    callback expectedError

            instance.create 'default', params, (err, response) ->
                expect(err).to.eql expectedError
                expect(response).to.be undefined
                done()

        it 'should return the saving info if everything went ok', (done) ->

            expectedResponse =
                this : 'is'
                a : 'document info'

            params =
                index: 'default'
                type: 'test'
                id: 1
                data:
                    random : 'document'

            instance.client = (config) ->
                create: (options, callback) ->
                    expected =
                        index: 'default'
                        type: 'test'
                        id: 1
                        body:
                            random : 'document'
                    expect(expected).to.eql options
                    callback null, expectedResponse

            instance.create 'default', params, (err, response) ->
                expect(err).to.be null
                expect(response).to.eql expectedResponse
                done()

    describe 'bulk', ->

        it 'should return an error if something bad happened', (done) ->

            expectedError = 'System failure'

            instance.client = (dataSource) ->
                bulk: (index, callback) ->
                    callback expectedError

            instance.bulk 'default', 'test', (err, response) ->
                expect(err).to.eql expectedError
                expect(response).to.be undefined
                done()

        it 'should return a success message if the items were correctly saved', (done) ->

            expectedResponse = 'That is nice'

            instance.client = (dataSource) ->
                bulk: (index, callback) ->
                    callback null, expectedResponse

            instance.bulk 'default', 'test', (err, response) ->
                expect(err).to.be null
                expect(response).to.eql expectedResponse
                done()

    describe 'indexExists', ->

        it 'should return an error if something odd happens', (done) ->

            expectedError = 'Odd error'

            instance.client = (dataSource) ->
                indices:
                    exists: (index, callback) ->
                        callback expectedError

            instance.indexExists 'default', 'test', (err, response) ->
                expect(err).to.eql expectedError
                expect(response).to.be undefined
                done()

        it 'should return true if the index was found', (done) ->

            instance.client = (dataSource) ->
                indices:
                    exists: (index, callback) ->
                        callback null, true

            instance.indexExists 'default', 'test', (err, response) ->
                expect(err).to.be null
                expect(response).to.be.ok()
                done()

    describe 'createIndex', ->

        it 'should return an error if something odd happens', (done) ->

            expectedError = 'Odd error'

            instance.client = (dataSource) ->
                indices:
                    create: (index, callback) ->
                        callback expectedError

            instance.createIndex 'default', 'test', (err, response) ->
                expect(err).to.eql expectedError
                expect(response).to.be undefined
                done()

        it 'should return true if the index was found', (done) ->

            expectedResponse = 'I have created your index, master'

            instance.client = (dataSource) ->
                indices:
                    create: (index, callback) ->
                        callback null, expectedResponse

            instance.createIndex 'default', 'test', (err, response) ->
                expect(err).to.be null
                expect(response).to.eql expectedResponse
                done()