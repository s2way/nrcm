_ = require 'underscore'

class CouchMuffin
    constructor: (params) ->
        @_dataSourceName = params?.dataSourceName ? 'default'
        @_type = params?.type
        @_validate = params?.validate
        @_keyPrefix = '' || params?.keyPrefix

    init: ->
        @_dataSource = @component 'DataSource.Couchbase', @_dataSourceName
        @_validator = @component 'Validator', validate: @_validate
        @_cherries = @component 'Cherries'
        @$ = @component 'QueryBuilder'

    _query: (statement, callback) ->
        @_bucket.query query, (error, result) ->
            if error
                callback error
            else
                callback null, result

    # Bind all methods from MyNinja into the model instance (expect for init() and bind() itself)
    bind: (model) ->
#        methodsToBind = ['findById', 'find', 'findAll', 'removeAll', 'removeById', 'remove', 'query', 'updateAll', 'save']
        methodsToBind = ['findById', 'findManyById', 'removeById']
        for methodName in methodsToBind
            muffinMethod = @[methodName]
            ((muffinMethod) =>
                model[methodName] = =>
                    return muffinMethod.apply(@, arguments)
            )(muffinMethod)

    # Finds a single record using the primary key
    # @param {string} id The record id
    # @param {function} callback Called when the operation is completed (error, result)
    findById: (id, callback) ->
        @findManyById id, callback

    # Finds many records using the primary key
    # @param {array|string} ids The records id within an array of Strings
    # @param {function} callback Called when the operation is completed (error, result)
    findManyById: (ids, callback) ->
        idsWithPrefix = []
        idsWithPrefix = ("#{@_keyPrefix}#{value}" for value in ids)
        @_dataSource.bucket.getMulti idsWithPrefix, (error, result) ->
            return callback error if error
            return callback null, null if result.length is 0
            return callback null, result

    # Remove a single record using the primary key
    # @param {array|string} ids The records id within an array of Strings
    # @param {function} callback Called when the operation is completed (error, result)
    removeById: (id, options, callback) ->
        options = {} || options
        idWithPrefix = "#{@_keyPrefix}#{id}"
        @_dataSource.bucket.remove idWithPrefix, options, (error, result) ->
            return callback error if error
            return callback null, null if result.length is 0
            return callback null, result

    # Inserts a single record using the primary key, it fails if the key already exists
    # @param {string} id The record id
    # @param {Object} data The document itself
    # @param {Object} [options]
    #  @param {number} [options.expiry=0]
    #  Set the initial expiration time for the document.  A value of 0 represents
    #  never expiring.
    #  @param {number} [options.persist_to=0]
    #  Ensures this operation is persisted to this many nodes
    #  @param {number} [options.replicate_to=0]
    #  Ensures this operation is replicated to this many nodes
    # @param {function} callback Called after the operation (error, result)
    # @param {function} callback Called when the operation is completed (error, result)
    insert: (id, data, options, callback) ->
        options = {} || options
        @_dataSource.bucket.add id, data, options, (error, result) ->
            return callback error if error
            return callback null, null if result.length is 0
            return callback null, result

#    # Finds a single record using the specified conditions
#    find: (params) ->
#        conditions = params.conditions ? null
#        callback = params.callback ? ->
#
#        builder = @$.selectStarFrom(@_table).where(conditions)
#        builder.groupBy(params.groupBy) if params.groupBy?
#        builder.having(params.having) if params.having?
#        builder.limit(1)
#        sql = builder.build()
#        @_mysql.query sql, [], (error, results) ->
#            return callback(error) if error
#            return callback(null, results[0])

    # Finds several records using the specified conditions
    findAll: (params) ->
        callback = params.callback ? ->

        conditions = params.conditions ? null
        builder = @$.selectStarFrom(@_table)
        builder.where(conditions) if conditions
        builder.groupBy(params.groupBy) if params.groupBy?
        builder.having(params.having) if params.having?
        sql = builder.build()

        @_query sql, (error, results) ->
            return callback(error) if error
            return callback(null, results)

#    # Deletes all records from the table - BE CAREFUL
#    # @param {function} callback Called when the operation is completed (error)
#    removeAll: (callback) ->
#        sql = @$.deleteFrom(@_table).build()
#        @_mysql.query sql, [], (error) ->
#            return callback(error) if error
#            return callback()
#
#    # Deletes several records from the table using the primary key
#    # @param {function} callback Called when the operation is completed (error)
#    removeById: (id, callback) ->
#        sql = @$.deleteFrom(@_table).where(
#            @$.equal(@_primaryKey, @$.value(id))
#        ).build()
#        @_mysql.query sql, [], (error) ->
#            return callback(error) if error
#            return callback()
#
#    # Deletes several records from the table using the specified conditions
#    # @param {function} callback Called when the operation is completed (error)
#    remove: (conditions, callback) ->
#        sql = @$.deleteFrom(@_table).where(conditions).build()
#        @_mysql.query sql, [], (error) ->
#            return callback(error) if error
#            return callback()
#
#    # Issues a query to the database (just a wrapper)
#    # @param
#    query: (query, params, callback) ->
#        @_mysql.query query, params, callback
#
#    # Updates all records of the table with the given values and using the given conditions
#    updateAll: (params) ->
#        conditions = params.conditions
#        callback = params.callback
#        data = @_cherries.copy(params.data)
#        escape = params.escape ? true
#
#        if escape
#            for prop of data
#                data[prop] = @$.value(data[prop])
#
#        sql = @$.update(@_table).set(data).where(conditions).build()
#        @_mysql.query sql, [], callback
#
#    # Saves the specified data if it is validated and matched against the validate object
#    save: (params) ->
#        callback = params.callback ? ->
#        data = params.data ? {}
#        escape = params.escape ? true
#        validate = params.validate ? true
#        match = params.match ? true
#
#        # Make copies of data so that the modification of the JSON won't affected the original one
#        original = @_cherries.copy(data)
#        data = @_cherries.copy(data)
#
#        if escape
#            for prop of data
#                data[prop] = @$.value(data[prop])
#
#        afterValidate = (error = null) =>
#            return callback(error) if error
#
#            if match and @_validate?
#                matched = @_validator.match data
#                return callback(name: 'MatchFailed', fields: matched) unless matched is true
#
#            if data[@_primaryKey]?
#                primaryKeyValue = data[@_primaryKey]
#                delete data[@_primaryKey]
#                sql = @$.update(@_table).set(data).where(
#                    @$.equal(@_primaryKey, primaryKeyValue)
#                ).build()
#                @_mysql.query sql, [], (error) =>
#                    return callback(error) if error
#                    original[@_primaryKey] = primaryKeyValue
#                    return callback(null, original)
#            else
#                sql = @$.insertInto(@_table).set(data).build()
#                @_mysql.query sql, [], (error, results) =>
#                    return callback(error) if error
#                    original[@_primaryKey] = results.insertId
#                    return callback(null, original)
#
#        if validate and @_validate?
#            @_validator.validate data, afterValidate
#        else
#            afterValidate()

module.exports = CouchMuffin
