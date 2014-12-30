expect = require 'expect.js'
Loader = require '../../../../src/Util/Loader'
path = require 'path'

describe 'CouchMuffin', ->

    instance = null
    loader = null
    params = null
    stdMyData = null
    stdMyError = null

    beforeEach ->
        params =
            dataSourceName: 'test'
            type: 'testing'
            keyPrefix: 'testing.test_'
            autoId: 'uuid'
            validate:
                string: (value, data, callback) ->
                    return callback(error: '') if typeof value isnt 'string'
                    callback()
                number: (value, data, callback) ->
                    return callback(error: '') if typeof value isnt 'number'
                    callback()
        loader = new Loader
        stdMyData =
            MyKey:
                cas:
                    '0': '000000'
                    '1': '111111'
                value:
                    string: 'string'
                    number: 1
        stdMyError =
            name: 'MyError'

    describe 'findById', ->

        it 'should issue the query for finding a record by id', (done) ->
            stdError = null
            stdResult = stdMyData

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    getMulti: (ids, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findById 'MyKey', (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    getMulti: (ids, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findById 'MyKey', (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()

    describe 'findManyById', ->

        it 'should issue the query for finding many records by ids', (done) ->
            stdError = null
            stdResult = stdMyData

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    getMulti: (ids, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findManyById ['MyKey','MyKey1'], (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    getMulti: (ids, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findManyById ['MyKey','MyKey1'], (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()

    describe 'removeById', ->

        it 'should remove the record by id', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey
            delete stdResult.value

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    remove: (id, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.removeById 'MyKey', (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    remove: (id, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.removeById 'MyKey', (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()

    describe 'save', ->

        it 'should save the record by id', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    upsert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save 'MyKey', stdResult, {}, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should save the record by id without validation', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            stdOptions =
                validate: false
                match: false

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    upsert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save 'MyKey', stdResult, stdOptions, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = stdMyData.MyKey.value

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    upsert: (id, data, options, callback) ->
                        callback stdError, null

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save 'MyKey', stdResult, {}, (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()

        it 'should pass the error to the callback if validation fails', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    upsert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save 'MyKey', {}, {}, (error, result) ->
                expect(error.name).to.be('ValidationFailed')
                expect(result).not.to.be.ok()
                done()

    describe 'insert', ->

        it 'should insert the record using the id passed', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert 'MyKey', stdResult, {}, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should save the record by id without validation', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            stdOptions =
                validate: false
                match: false

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert 'MyKey', stdResult, stdOptions, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = stdMyData.MyKey.value

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, null

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert 'MyKey', stdResult, {}, (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()

        it 'should pass the error to the callback if validation fails', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert 'MyKey', {}, {}, (error, result) ->
                expect(error.name).to.be('ValidationFailed')
                expect(result).not.to.be.ok()
                done()

        it 'should insert the record using an uuid', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert null, stdResult, {}, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should insert the record using a counter', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            params.autoId = 'counter'

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult
                    counter: (id, delta, callback) ->
                        callback null, 1

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert null, stdResult, {}, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass error to the callback if there is no rule for auto id', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            params.autoId = ''

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert null, stdResult, {}, (error, result) ->
                expect(error).to.be.ok()
                expect(result).not.to.be.ok()
                done()

    describe 'bind()', ->

        it 'should bind all CouchMuffin methods to the specified model', (done) ->
            instance = loader.createComponent 'Database.CouchMuffin', params
            myParams = {}
            instance.findAll = ->
                expect(arguments[0]).to.be myParams
                done()
            model = {}
            instance.bind model
            model.findAll(myParams)

    describe 'find', ->
        it 'should find one record', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            queryParams =
                conditions: "_type = '_tableName'"
                groupBy: " GROUP BY test"
                having: " HAVING test > 1"

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    query: (query, callback) ->
                        callback stdError, stdResult
                    n1ql:
                        fromString: (str) ->
                            str
                bucketName: "teste"

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.find queryParams, (error, result) ->
                expect(result).to.be stdResult
                done()

    describe 'findAll', ->
        it 'should find all records', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            queryParams =
                conditions: "_type = '_tableName'"
                groupBy: " GROUP BY test"
                limit: " LIMIT 1"
                having: " HAVING test > 1"

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    query: (query, callback) ->
                        callback stdError, stdResult
                    n1ql:
                        fromString: (str) ->
                            str
                bucketName: "teste"

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findAll queryParams, (error, result) ->
                expect(result).to.be stdResult
                done()
