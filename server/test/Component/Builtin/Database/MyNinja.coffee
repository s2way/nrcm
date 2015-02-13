expect = require 'expect.js'
Loader = require '../../../../src/Util/Loader'
path = require 'path'

describe 'MyNinja', ->

    instance = null
    loader = null

    beforeEach ->
        loader = new Loader

    describe 'changeTable', ->

        it 'should set the new table', (done) ->
            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()
            instance.changeTable('space')
            expect(instance._table).to.be('space')
            done()

    describe 'findById', ->

        it 'should issue the query for finding a record by id', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be 'SELECT * FROM sky WHERE id = 1 LIMIT 1'
                    callback(null, [record])

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            record =
                id: 1
                name: 'A Star'

            instance.init()
            instance.findById(1, (error, result) ->
                expect(error).not.to.be.ok()
                expect(result).to.be record
                done()
            )

        it 'should pass the error to the callback if something occurs', (done) ->
            error = name: 'MyError'
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->callback(error)

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.findById(1, (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()
            )

    describe 'find()', ->

        it 'should issue the query for finding a single record using the specified condition', (done) ->
            record = {}
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "SELECT * FROM sky WHERE (a > 10 OR b LIKE '%string%') GROUP BY field HAVING c > d LIMIT 1"
                    callback(null, [record])
            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()
            $ = instance.$

            instance.find(
                conditions: $.or(
                    $.greater('a', 10),
                    $.like('b', $.value('%string%'))
                )
                groupBy: 'field'
                having: 'c > d'
                callback: (error, results) ->
                    expect(error).not.to.be.ok()
                    expect(results).to.be record
                    done()
            )


        it 'should pass the error to the callback if something occurs', (done) ->
            error = name: 'MyError'
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(error)

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.find(callback: (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()
            )

    describe 'findAll()', ->

        it 'should issue the query for finding lots of records using the specified condition', (done) ->
            record = {}
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "SELECT * FROM sky WHERE (a > 10 OR b LIKE '%string%') GROUP BY field HAVING c > d"
                    callback(null, record)
            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()
            $ = instance.$

            instance.findAll(
                conditions: $.or(
                    $.greater('a', 10),
                    $.like('b', $.value('%string%'))
                )
                groupBy: 'field'
                having: 'c > d'
                callback: (error, results) ->
                    expect(error).not.to.be.ok()
                    expect(results).to.be record
                    done()
            )

        it 'should pass the error to the callback if something occurs', (done) ->
            error = name: 'MyError'
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(error)

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.findAll(callback: (error, result) ->
                expect(error.name).to.be('MyError')
                expect(result).not.to.be.ok()
                done()
            )

    describe 'removeAll()', ->

        it 'should delete all records from the table', (done) ->
            record = {}
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "DELETE FROM sky"
                    callback(null, record)
            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.removeAll((error) ->
                expect(error).not.to.be.ok()
                done()
            )

        it 'should pass the error to the callback if something occurs', (done) ->
            error = name: 'MyError'
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(error)

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.removeAll((error) ->
                expect(error.name).to.be('MyError')
                done()
            )

    describe 'removeById()', ->

        it 'should delete a single record from the table using the primary key', (done) ->
            record = {}
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "DELETE FROM sky WHERE id = 1"
                    callback(null, record)
            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()
            instance.removeById(1, (error) ->
                expect(error).not.to.be.ok()
                done()
            )

        it 'should pass the error to the callback if something occurs', (done) ->
            error = name: 'MyError'
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(error)

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.removeById(1, (error) ->
                expect(error.name).to.be('MyError')
                done()
            )

    describe 'remove()', ->

        it 'should delete a single record from the table using the specified condition', (done) ->
            record = {}
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "DELETE FROM sky WHERE (a > b OR c = d)"
                    callback(null, record)
            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()
            $ = instance.$
            instance.remove($.or(
                $.greater('a', 'b'),
                $.equal('c', 'd')
            ), (error) ->
                expect(error).not.to.be.ok()
                done()
            )

        it 'should pass the error to the callback if something occurs', (done) ->
            error = name: 'MyError'
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(error)

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.remove('', (error) ->
                expect(error.name).to.be('MyError')
                done()
            )

    describe 'query()', ->
        it 'should call mysql.query() passing all the parameters', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(null, {})

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            instance.query('SELECT * FROM something', [], (error, results) ->
                expect(error).not.to.be.ok()
                expect(results).to.be.ok()
                done()
            )

    describe 'updateAll()', ->

        it 'should perform an update in the specified fields/values with the specified conditions', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "UPDATE sky SET a = 1, b = 2, c = 'three' WHERE (b = 10 OR a > b)"
                    callback(null, {})

            instance = loader.createComponent 'Database.MyNinja', table: 'sky'
            instance.init()

            $ = instance.$

            data = a: 1, b: 2, c: 'three'
            conditions = $.or(
                $.equal('b', $.value(10)),
                $.greater('a', 'b')
            )

            instance.updateAll(
                data: data
                conditions: conditions
                callback: (error, results) ->
                    expect(error).not.to.be.ok()
                    expect(results).to.be.ok()
                    done()
            )

    describe 'save()', ->

        it 'should validate the data before saving and return an error if it fails', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(null, {})

            instance = loader.createComponent 'Database.MyNinja',
                table: 'sky'
                validate:
                    string: (value, data, callback) ->
                        return callback(error: '') if typeof value isnt 'string'
                        callback()
                    number: (value, data, callback) ->
                        return callback(error: '') if typeof value isnt 'number'
                        callback()

            instance.init()
            data =
                string: 'it is a string',
                number: 'it is not a number'

            instance.save(
                data: data
                callback: (error, results) ->
                    expect(error.name).to.be('ValidationFailed')
                    expect(results).not.to.be.ok()
                    done()
            )

        it 'should match the data before saving and return an error if it fails', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(null, {})

            instance = loader.createComponent 'Database.MyNinja',
                table: 'sky'
                validate:
                    number: (value, data, callback) ->
                        return callback(message: 'It is not a number') if typeof value isnt 'number'
                        callback()
                    string: (value, data, callback) ->
                        return callback(message: 'It is not a string') if typeof value isnt 'string'
                        callback()

            instance.init()
            data =
                string: 'it is a string'
                number: 1
                another: 'this one cannot be saved'

            instance.save(
                validate: false
                match: true
                data: data
                callback: (error, results) ->
                    expect(error.name).to.be('MatchFailed')
                    expect(error.fields).to.be.ok()
                    expect(results).not.to.be.ok()
                    done()
            )

        it 'should validate and match data and call the callback if the operation is successful', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(null, {})

            instance = loader.createComponent 'Database.MyNinja',
                table: 'sky'
                validate:
                    number: (value, data, callback) ->
                        return callback(message: 'It is not a number') if typeof value isnt 'number'
                        callback()
                    string: (value, data, callback) ->
                        return callback(message: 'It is not a string') if typeof value isnt 'string'
                        callback()

            instance.init()
            data =
                string: 'it is a string'
                number: 1

            instance.save(
                data: data
                callback: (error, results) ->
                    expect(error).not.to.be.ok()
                    expect(results).to.be.ok()
                    done()
            )

        it 'should pass the error to the callback if the insert/update fails', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    callback(name: 'MyError')

            instance = loader.createComponent 'Database.MyNinja',table: 'sky'
            instance.init()
            data =
                string: 'it is a string'
                number: 1

            instance.save(
                data: data
                callback: (error) ->
                    expect(error.name).to.be('MyError')
                    done()
            )

        it 'should insert the data if the id is not passed', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "UPDATE sky SET name = 'Record' WHERE id = 1"
                    callback(null, {})

            instance = loader.createComponent 'Database.MyNinja',table: 'sky'
            instance.init()
            data =
                id: 1
                name: 'Record'

            instance.save(
                data: data
                callback: (error, results) ->
                    expect(error).not.to.be.ok()
                    expect(results).to.be.ok()
                    done()
            )


        it 'should update the data if the id is passed', (done) ->
            loader.mockComponent 'DataSource.MySQL',
                init: ->
                query: (query, params, dataSourceName, callback) ->
                    expect(query).to.be "INSERT INTO sky SET name = 'Record'"
                    callback(null, {})

            instance = loader.createComponent 'Database.MyNinja',table: 'sky'
            instance.init()
            data =
                name: 'Record'

            instance.save(
                data: data
                callback: (error, results) ->
                    expect(error).not.to.be.ok()
                    expect(results).to.be.ok()
                    done()
            )

    describe 'bind()', ->

        it 'should bind all MyNinja methods to the specified model', (done) ->
            instance = loader.createComponent 'Database.MyNinja',table: 'sky'
            params = {}
            instance.findAll = ->
                expect(arguments[0]).to.be params
                done()
            model = {}
            instance.bind model
            model.findAll(params)