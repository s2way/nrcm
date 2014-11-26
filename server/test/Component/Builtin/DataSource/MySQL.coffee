MySQL = require('./../../../../src/Component/Builtin/DataSource/MySQL')
expect = require('expect.js')

describe 'MySQL.js', ->
    mockMySQL = (methods, connectionError) ->
        createConnection: ->
            connect: (callback) ->
                setImmediate ->
                    callback connectionError
            end: ->
            query: methods.query
            escapeId: (value) ->
                value

    instance = null

    beforeEach ->
        instance = new MySQL('default')
        instance.core = dataSources:
            default:
                host: 'localhost'
                user: 'root'
                password: ''
                database: 's2way'
                port: 3306
            anotherDataSource:
                host: 'another'
                user: 'root'
                password: ''
                database: 'another'
                port: 3306

        instance.component = (componentName) ->
            if componentName is 'Logger'
                init: ->
                log: ->
                info: ->
                config: ->

        instance.init()

    describe 'MySQL()', ->
        it 'should use default if no parameter is passed', ->
            instance = new MySQL()
            expect(instance._dataSourceName).to.be.ok()

    describe 'query()', ->
        it 'should call MySQL query method', (done) ->
            myQuery = 'SELECT * FROM x WHERE y = ?'
            myParams = [1]
            myFields = ['something']
            myResult = [{something: 'here'},{something: 'there'}]
            instance._databaseSelected['default'] = true
            instance._mysql = mockMySQL(query: (query, params, callback) ->
                expect(query).to.be myQuery
                expect(params).to.be myParams
                setImmediate ->
                    callback null, myResult, myFields
            )
            instance.query myQuery, myParams, (err, rows, fields) ->
                expect(err).not.to.be.ok()
                expect(rows).to.be myResult
                expect(fields).to.be myFields
                done()

        it 'should connect to the DataSource specified in the params', (done) ->
            instance._mysql =
                createConnection: (params) ->
                    expect(params.host).to.be 'another'
                    done()
                    return connect: ->

            instance.query 'SELECT 1', [], 'anotherDataSource', ->

        it 'should handle multiple calls passing different data sources correctly', (done) ->
            databasesSelected = []
            instance._mysql = mockMySQL({
                query: (query, params, callback) -> callback()
            })
            instance.use = (database, dataSourceNameOrCallback, callback) ->
                databasesSelected.push database
                callback()
            instance.query 'SELECT 1', [], 'default', ->
                instance.query 'SELECT 2', [], 'anotherDataSource', ->
                    expect(databasesSelected).to.eql ['s2way', 'another']
                    done()

        it 'should call the use command before query if the database configuration is specified', (done) ->
            instance._mysql = mockMySQL(query: (query, params, callback) ->
                setImmediate ->
                    callback()
            )
            instance.use = (database, dataSourceName, callback) ->
                expect(database).to.be 's2way', database
                callback()

            instance.query 'SELECT * FROM sky', [], ->
                done()

        it 'should call the use command before executing the query if the database is specified in the DataSource configurations', (done) ->
            instance._mysql = mockMySQL(query: (query, params, callback) ->
                setImmediate ->
                    callback()
            )
            instance.use = (database, dataSourceName, callback) ->
                expect(database).to.be 's2way'
                callback()

            instance.query 'SELECT * FROM sky', [], ->
                done()

        it 'should call the callback passing an error if uses fails', (done) ->
            instance._mysql = mockMySQL(query: ->
                expect().fail()
            )
            instance.use = (database, dataSourceName, callback) ->
                callback {}

            instance.query 'SELECT * FROM sky', [], (err) ->
                expect(err).to.be.ok()
                done()

        it 'should recycle the connection if the query method is called twice', (done) ->
            query = 'SELECT * FROM sky'
            instance._databaseSelected['default'] = true
            instance._mysql = mockMySQL(query: (query, params, callback) ->
                callback()
            )
            instance.query query, [], ->
                instance.query query, [], ->
                    done()

        it 'should call the callback passing an error if a connection error occurs', (done) ->
            connectionError = error: 'connection'
            instance._mysql = mockMySQL({}, connectionError)
            instance.query 'SELECT * FROM sky', [], (err) ->
                expect(err).to.be connectionError
                done()

    describe 'use()', ->
        it 'should issue USE DATABASE command', (done) ->
            expectedQuery = 'USE database;'
            instance._mysql = mockMySQL(query: (query, callback) ->
                expect(query).to.be expectedQuery
                setImmediate -> callback null
            )
            instance.use 'database', -> done()

        it 'should call the callback passing an error if a connection error occurs', (done) ->
            expectedQuery = 'USE database;'
            instance._mysql = mockMySQL(query: (query, callback) ->
                expect(query).to.be expectedQuery
                setImmediate ->
                    err = {}
                    callback err
            )
            instance.use 'database', (err) ->
                expect(err).to.be.ok()
                done()

        it 'should call the callback passing an error if an error occurs in the query function', (done) ->
            connectionError = {}
            instance._mysql = mockMySQL({}, connectionError)
            instance.use 'database', (err) ->
                expect(err).to.be.ok()
                done()

    describe 'call()', ->
        it 'should call the callback passing an error if an error occurs in the query function', (done) ->
            connectionError = {}
            instance._mysql = mockMySQL({}, connectionError)
            instance.call 'some_procedure', [], (err) ->
                expect(err).to.be.ok()
                done()

        it 'should call the use command before query if the database configuration is specified', (done) ->
            useCommandIssued = false
            instance._mysql = mockMySQL(query: (query, params, callback) ->
                setImmediate ->
                    callback()
            )
            instance.use = (database, dataSourceName, callback) ->
                expect(database).to.be 's2way', database
                useCommandIssued = true
                callback()

            instance.call 'minha_procedure', [], ->
                expect(useCommandIssued).to.be.ok()
                done()

        it 'should issue a CALL procedure command', (done) ->
            procedureParams = [
                1
                'two'
            ]
            instance._databaseSelected['default'] = true
            instance._mysql = mockMySQL(query: (query, params, callback) ->
                expect(query).to.be 'CALL some_procedure(?, ?)'
                expect(params).to.be procedureParams
                callback null
            )
            instance.call 'some_procedure', procedureParams, ->
                done()

        it 'should throw an IllegalArgument if the first parameter is not a string', ->
            instance._mysql = mockMySQL({})
            expect(->
                instance.call()
            ).to.throwException (e) ->
                expect(e.name).to.be 'IllegalArgument'

    describe 'destroy()', ->
        it 'should call connection.end()', (done) ->
            instance._connections['default'] = end: ->
                done()
            instance.destroy()
