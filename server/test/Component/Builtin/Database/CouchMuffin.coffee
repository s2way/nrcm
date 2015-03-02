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
            manualId: true
            validate:
                string: (value, data, callback) ->
                    return callback error: '' if typeof value isnt 'string'
                    callback()
                number: (value, data, callback) ->
                    return callback error: '' if typeof value isnt 'number'
                    callback()
            trackDates: true
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

    describe 'invoked', ->

        it 'should return the last method invoked', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    touch: (id, expiry, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.exist 'MyKey', (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()
            expect(instance.invoked()).to.be.equal 'exist'

    describe 'exists', ->

        it 'should return success if the id exists', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    touch: (id, expiry, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.exist 'MyKey', (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should return error if the id doest not exist', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    touch: (id, expiry, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.exist 'MyKey', (error, result) ->
                expect(result).not.to.be.ok()
                expect(error).to.be stdError
                done()

    describe 'findById', ->

        it 'should issue the query for finding a record by id', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    get: (info, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findById id: 'MyKey', (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    get: (info, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findById id: 'MyKey', (error, result) ->
                expect(error.name).to.be 'MyError'
                expect(result).not.to.be.ok()
                done()

    describe 'findManyById', ->

        it 'should issue the query for finding many records by ids', (done) ->
            stdError = null
            stdResult = stdMyData

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    getMulti: (info, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findManyById ids: ['MyKey','MyKey1'], (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = null

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    getMulti: (info, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findManyById ids: ['MyKey','MyKey1'], (error, result) ->
                expect(error.name).to.be 'MyError'
                expect(result).not.to.be.ok()
                done()

    describe 'removeById', ->

        it 'should remove the record by id', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey
            delete stdResult.value
            paramsToSave =
                id: 'MyKey'

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    remove: (id, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.removeById paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = null
            paramsToSave =
                id: 'MyKey'

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    remove: (id, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.removeById paramsToSave, (error, result) ->
                expect(error.name).to.be 'MyError'
                expect(result).not.to.be.ok()
                done()

    describe 'save', ->

        it 'should save the record by id', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            paramsToSave =
                id: 'MyKey'
                data: stdResult

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    replace: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should save the record by id without validation', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            stdOptions =
                validate: false
                match: false
            paramsToSave =
                id: 'MyKey'
                data: stdResult
                options: stdOptions

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    replace: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = stdMyData.MyKey.value
            paramsToSave =
                id: 'MyKey'
                data: stdResult

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    replace: (id, data, options, callback) ->
                        callback stdError, null

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save paramsToSave, (error, result) ->
                expect(error.name).to.be 'MyError'
                expect(result).not.to.be.ok()
                done()

        it 'should pass the error to the callback if validation fails', (done) ->
            stdError = stdMyError
            stdResult = null
            paramsToSave =
                id: 'MyKey'

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    replace: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.save params, (error, result) ->
                expect(error.name).to.be('ValidationFailed')
                expect(result).not.to.be.ok()
                done()

    describe 'insert', ->

        it 'should insert the record using the id passed', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            paramsToSave =
                id: 'MyKey'
                data: stdResult

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should save the record by id without validation', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            stdOptions =
                validate: false
                match: false
            paramsToSave =
                id: 'MyKey'
                data: stdResult
                options: stdOptions


            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass the error to the callback if something occurs', (done) ->
            stdError = stdMyError
            stdResult = stdMyData.MyKey.value
            paramsToSave =
                id: 'MyKey'
                data: stdResult

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, null

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()

        it 'should pass the error to the callback if validation fails', (done) ->
            stdError = stdMyError
            stdResult = null
            paramsToSave =
                id: 'MyKey'

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
                expect(error.name).to.be('ValidationFailed')
                expect(result).not.to.be.ok()
                done()

        it 'should insert the record using an uuid', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            paramsToSave =
                data: stdResult

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should insert the record using a counter', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            params.autoId = 'counter'
            paramsToSave =
                data: stdResult

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult
                    counter: (id, delta, callback) ->
                        callback null, 1

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should insert the record using a counter and create it if does not exist', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            params.autoId = 'counter'
            paramsToSave =
                data: stdResult
            errorNotExist =
                code: 13

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult if data != 1
                        callback null, 1 if data == 1
                    counter: (id, delta, callback) ->
                        callback errorNotExist

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be stdResult
                done()

        it 'should pass error to the callback if there is no rule for auto id', (done) ->
            stdError = null
            stdResult = stdMyData.MyKey.value
            params.autoId = ''
            paramsToSave =
                data: stdResult

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    insert: (id, data, options, callback) ->
                        callback stdError, stdResult

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.insert paramsToSave, (error, result) ->
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
                fields: ['name', 'test']
                groupBy: 'test'
                having: 'test > 1'

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    query: (query, callback) ->
                        callback stdError, stdResult
                n1ql:
                    fromString: (str) ->
                        str
                bucketName: 'teste'

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
                groupBy: 'test'
                limit: '1'
                having: 'test > 1'

            loader.mockComponent 'DataSource.Couchbase',
                init: ->
                bucket:
                    query: (query, callback) ->
                        callback stdError, stdResult
                n1ql:
                    fromString: (str) ->
                        str
                bucketName: 'teste'

            instance = loader.createComponent 'Database.CouchMuffin', params

            instance.init()
            instance.findAll queryParams, (error, result) ->
                expect(result).to.be stdResult
                done()
