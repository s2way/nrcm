_ = require 'underscore'
uuid = require 'node-uuid'

class CouchMuffin
    constructor: (params) ->
        @_dataSourceName = params?.dataSourceName ? 'default'
        @_type = params?.type
        @_validate = params?.validate
        @_keyPrefix = '' || params?.keyPrefix
        @_autoId = '' || params?.autoId
        @_counterKey = "#{@_keyPrefix}counter"

    init: ->
        @_dataSource = @component 'DataSource.Couchbase', @_dataSourceName
        @_validator = @component 'Validator', validate: @_validate
        @_cherries = @component 'Cherries'
        @$ = @component 'QueryBuilder', true

    _query: (query, callback) ->
        @_bucket.query query, (error, result) ->
            callback error if error
            callback null, result

    _createCounter: (callback) ->
        @insert @_counterKey, 1, (error) ->
            return callback error if error
            return callback null, 1

    _uuid: ->
        uuid.v4()

    _counter: (callback) ->
        @_dataSource.bucket.counter @_counterKey, 1, (error, result) ->
            _createCounter callback if error and error.code == 13
            return callback error if error
            return callback null, null if result.length is 0
            return callback null, result.value

    # Bind all methods from MyNinja into the model instance (expect for init() and bind() itself)
    bind: (model) ->
        methodsToBind = ['findById', 'findManyById', 'removeById', 'save', 'insert', 'findAll']
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
        if options instanceof Function
            callback = arguments[1]
            options = {}
        idWithPrefix = "#{@_keyPrefix}#{id}"
        @_dataSource.bucket.remove idWithPrefix, options, (error, result) ->
            return callback error if error
            return callback null, null if result.length is 0
            return callback null, result

    # Inserts a single record using the primary key, it updates if the key already exists
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
    save: (id, data, options, callback) ->
        return callback error: 'InvalidId' if id is null

        if options instanceof Function
            callback = arguments[2]
            options = {}

        afterValidate = (error = null) =>
            return callback(error) if error

            if match and @_validate?
                matched = @_validator.match data
                return callback(name: 'MatchFailed', fields: matched) unless matched is true

            @_dataSource.bucket.upsert id, data, options, (error, result) ->
                return callback error if error
                return callback null, null if result.length is 0
                return callback null, result

        if @_validate?
            @_validator.validate data, afterValidate
        else
            afterValidate()

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
        if options instanceof Function
            callback = arguments[2]
            options = {}

        afterId = (error, newId) =>
            return callback error if error

            afterValidate = (error = null) =>
                return callback error if error

                if match and @_validate?
                    matched = @_validator.match data
                    return callback name: 'MatchFailed', fields: matched unless matched is true

                @_dataSource.bucket.insert newId, data, options, (error, result) ->
                    return callback error if error
                    return callback null, null if result.length is 0
                    return callback null, result

            if @_validate?
                @_validator.validate data, afterValidate
            else
                afterValidate()

        if id is null
            afterId null, @_uuid() if @_autoId == 'uuid'
            @_counter afterId if @_autoId == 'counter'
            return callback error: 'InvalidId'
        else
            afterId null, id

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
    findAll: (params, callback) ->
        conditions = params.conditions ? null
        builder = @$.selectStarFrom(@_dataSource.bucketName)
        builder.where(conditions) if conditions
        builder.groupBy(params.groupBy) if params.groupBy?
        builder.having(params.having) if params.having?
        sql = builder.build()

        @_query sql, callback

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

module.exports = CouchMuffin
