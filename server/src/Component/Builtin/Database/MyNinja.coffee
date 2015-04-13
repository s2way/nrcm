uuid = require 'node-uuid'

class MyNinja
    constructor: (params) ->
        @_dataSourceName = params?.dataSourceName ? 'default'
        @_table = params?.table
        @_primaryKey = params?.primaryKey ? 'id'
        @_validate = params?.validate

    init: ->
        @_mysql = @component 'DataSource.MySQL', @_dataSourceName
        @_validator = @component 'Validator', validate: @_validate
        @_cherries = @component 'Cherries'
        @$ = @component 'QueryBuilder'

    # Bind all methods from MyNinja into the model instance (expect for init() and bind() itself)
    bind: (model) ->
        methodsToBind = [
            'findById',
            'find',
            'findAll',
            'removeAll',
            'removeById',
            'remove',
            'query',
            'updateAll',
            'save',
            'changeTable',
            'startTransaction',
            'commit',
            'rollback'
        ]
        for methodName in methodsToBind
            ninjaMethod = @[methodName]
            ((ninjaMethod) =>
                model[methodName] = =>
                    return ninjaMethod.apply(@, arguments)
            )(ninjaMethod)
        model.$ = @$

    changeTable: (tableName) ->
        @_table = tableName

    # Finds a single record using the primary key
    # @param {object} id The record id
    # @param {function} callback Called when the operation is completed (error, result)
    findById: (id, callback) ->
        sql = @$.selectStarFrom(@_table).where(
            @$.equal(@_primaryKey, @$.value(id))
        ).limit(1).build()

        @_mysql.query sql, [], @_dataSourceName, (error, result) ->
            return callback(error) if error
            return callback(null, null) if result.length is 0
            return callback(null, result[0])

    # Finds a single record using the specified conditions
    find: (params) ->
        conditions = params.conditions ? null
        callback = params.callback ? ->

        builder = @$.selectStarFrom(@_table).where(conditions)
        builder.groupBy(params.groupBy) if params.groupBy?
        builder.having(params.having) if params.having?
        builder.limit(1)
        sql = builder.build()
        @_mysql.query sql, [], @_dataSourceName, (error, results) ->
            return callback(error) if error
            return callback(null, results[0])

    # Finds several records using the specified conditions
    findAll: (params) ->
        callback = params.callback ? ->
        conditions = params.conditions ? null
        builder = @$.selectStarFrom(@_table)
        builder.where(conditions) if conditions
        builder.groupBy(params.groupBy) if params.groupBy?
        builder.having(params.having) if params.having?
        sql = builder.build()
        @_mysql.query sql, [], @_dataSourceName, (error, results) ->
            return callback(error) if error
            return callback(null, results)

    # Deletes all records from the table - BE CAREFUL
    # @param {function} callback Called when the operation is completed (error)
    removeAll: (callback) ->
        sql = @$.deleteFrom(@_table).build()
        @_mysql.query sql, [], @_dataSourceName, (error) ->
            return callback(error) if error
            return callback()

    # Deletes several records from the table using the primary key
    # @param {function} callback Called when the operation is completed (error)
    removeById: (id, callback) ->
        sql = @$.deleteFrom(@_table).where(
            @$.equal(@_primaryKey, @$.value(id))
        ).build()
        @_mysql.query sql, [], @_dataSourceName, (error) ->
            return callback(error) if error
            return callback()

    # Deletes several records from the table using the specified conditions
    # @param {function} callback Called when the operation is completed (error)
    remove: (conditions, callback) ->
        sql = @$.deleteFrom(@_table).where(conditions).build()
        @_mysql.query sql, [], @_dataSourceName, (error) ->
            return callback(error) if error
            return callback()

    # Issues a query to the database (just a wrapper)
    # @param
    query: (query, paramsOrCallback, callback) ->
        params = paramsOrCallback
        if typeof paramsOrCallback is 'function'
            callback = paramsOrCallback
            params = []

        @_mysql.query query, params, @_dataSourceName, callback

    # Updates all records of the table with the given values and using the given conditions
    updateAll: (params) ->
        conditions = params.conditions
        callback = params.callback
        data = @_cherries.copy(params.data)
        escape = params.escape ? true

        if escape
            for prop of data
                data[prop] = @$.value(data[prop])

        sql = @$.update(@_table).set(data).where(conditions).build()
        @_mysql.query sql, [], @_dataSourceName, callback

    # Start a transaction
    startTransaction: (callback) ->
        sql = 'START TRANSACTION'
        @_mysql.query sql, [], @_dataSourceName, (error) ->
            return callback(error) if error
            return callback()

    # Commit a transaction
    commit: (callback) ->
        sql = 'COMMIT'
        @_mysql.query sql, [], @_dataSourceName, (error) ->
            return callback(error) if error
            return callback()

    # Rollback a transaction
    rollback: (callback) ->
        sql = 'ROLLBACK'
        @_mysql.query sql, [], @_dataSourceName, (error) ->
            return callback(error) if error
            return callback()

    # Saves the specified data if it is validated and matched against the validate object
    save: (params) ->
        callback = params.callback ? ->
        data = params.data ? {}
        escape = params.escape ? true
        validate = params.validate ? true
        match = params.match ? true
        conditions = params.conditions ? false

        # Make copies of data so that the modification of the JSON won't affected the original one
        original = @_cherries.copy(data)
        data = @_cherries.copy(data)

        if escape
            for prop of data
                data[prop] = @$.value(data[prop])

        afterValidate = (error = null) =>
            return callback(error) if error

            if match and @_validate?
                matched = @_validator.match data
                return callback(name: 'MatchFailed', fields: matched) unless matched is true

            if data[@_primaryKey]?
                primaryKeyValue = data[@_primaryKey]
                delete data[@_primaryKey]

                whereSql = if conditions then @$.and(@$.equal(@_primaryKey, primaryKeyValue), conditions) else @$.equal(@_primaryKey, primaryKeyValue)

                sql = @$.update(@_table).set(data).where(whereSql).build()
                @_mysql.query sql, [], @_dataSourceName, (error, results) =>
                    return callback(error) if error
                    original[@_primaryKey] = primaryKeyValue
                    original.info = results
                    return callback(null, original)
            else
                data.id = @$.escape(uuid.v1()) if params.uuid
                sql = @$.insertInto(@_table).set(data).build()
                @_mysql.query sql, [], @_dataSourceName, (error, results) =>
                    return callback(error) if error
                    original[@_primaryKey] = results.insertId
                    return callback(null, original)

        if validate and @_validate?
            @_validator.validate data, afterValidate
        else
            afterValidate()

module.exports = MyNinja
