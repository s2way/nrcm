_ = require 'underscore'
uuid = require 'node-uuid'

class CouchMuffin
    constructor: (options) ->
        @_dataSourceName = options?.dataSourceName || 'default'
        @_type = options?.type
        @_validate = options?.validate
        @_skipMatch = options?.skipMatch || []
        @_keyPrefix = options?.keyPrefix || ''
        @_autoId = options?.autoId || ''
        @_trackDates = options?.trackDates
        @_manualId = options?.manualId || false
        @_skipId = options?skipId || false
        @_method = ''
        if @_trackDates
            @_skipMatch.push '_createdAt'
            @_skipMatch.push '_lastUpdate'
        @_skipMatch.push '_type'
        @_skipMatch.push '_id'

    init: ->
        couch = @component 'DataSource.Couchbase', @_dataSourceName
        @_dataSource = {}
        @_dataSource.bucket = couch.limbo[@_dataSourceName]._bucket
        @_dataSource.n1ql = couch.n1ql
        @_validator = @component 'Validator',
            validate: @_validate
            skipMatch: @_skipMatch
        @_cherries = @component 'Cherries'

    _addType: (data) ->
        data._type = @_type if @_type? and data?

    _addCreatedAt: (data) ->
        data._createdAt = new Date().toISOString() if @_trackDates

    _addLastUpdate: (data) ->
        data._lastUpdate = new Date().toISOString() if @_trackDates

    _addId: (data, id) ->
        data._id = id unless @_skipId

    _query: (query, callback) ->
        @_dataSource.bucket.query (new @_dataSource.n1ql.fromString query), (error, result) ->
            return callback error if error
            return callback null, result

    _createCounter: (callback) ->
        data =
            id: 'counter'
            data: 1
            options:
                validate: false
                match: false
        @insert data, (error) ->
            return callback error if error
            return callback null, 1

    _uuid: ->
        uuid.v4()

    _counter: (callback) ->
        @_dataSource.bucket.counter "#{@_keyPrefix}counter", 1, (error, result) =>
            return @_createCounter callback if error and error.code is 13
            return callback error if error
            return callback null, result.value

    # Bind all methods from MyNinja into the model instance (expect for init() and bind() itself)
    bind: (model) ->
        methodsToBind = ['findById', 'findManyById', 'removeById', 'save', 'insert', 'find', 'findAll', 'exist', 'invoked']
        for methodName in methodsToBind
            muffinMethod = @[methodName]
            ((muffinMethod) =>
                model[methodName] = =>
                    return muffinMethod.apply(@, arguments)
            )(muffinMethod)

    # Returns the method that was invoked
    invoked: ->
        @_method

    # Finds a single record using the primary key (Facade to findManyById)
    # @param {string} id The record id
    # @param {function} callback Called when the operation is completed (error, result)
    findById: (params, callback) ->
        @_method = 'findById'
        id = params.id || null
        options = params.options || {}
        idWithPrefix = "#{@_keyPrefix}#{id}"

        @_dataSource.bucket.get idWithPrefix, options, (error, result) ->
            return callback error if error?
            return callback null, result

    # Finds many records using the primary key
    # @param {array|string} ids The records id within an array of Strings
    # @param {function} callback Called when the operation is completed (error, result)
    findManyById: (params, callback) ->
        @_method = 'findManyById'
        ids = params.ids || null
        idsWithPrefix = []
        idsWithPrefix = ("#{@_keyPrefix}#{value}" for value in ids)

        @_dataSource.bucket.getMulti idsWithPrefix, (error, result) =>
            return callback error if error? and !_.isNumber error
            if result
                newResult = {}
                for id of result
                    if @_type?
                        newResult[id.substr @_type.length + 1, id.length] = result[id]
                    else
                        newResult = result
                return callback null, newResult

    # Remove a single record using the primary key
    # @param {array|string} ids The records id within an array of Strings
    # @param {function} callback Called when the operation is completed (error, result)
    removeById: (params, callback) ->
        @_method = 'RemoveById'
        id = params.id || null
        options = params.options || {}

        idWithPrefix = "#{@_keyPrefix}#{id}"
        @_dataSource.bucket.remove idWithPrefix, options, (error, result) ->
            return callback error if error?
            return callback null, result

    # Inserts a single record using the primary key, it updates if the key already exists
    # @param {string} [params]
    #  @param {string} id The record id
    #  @param {Object} data The document itself
    #  @param {Object} [options]
    #   @param {number} [options.expiry=0]
    #   Set the initial expiration time for the document.  A value of 0 represents
    #   never expiring.
    #   @param {number} [options.persist_to=0]
    #   Ensures this operation is persisted to this many nodes
    #   @param {number} [options.replicate_to=0]
    #   Ensures this operation is replicated to this many nodes
    # @param {function} callback Called after the operation (error, result)
    # @param {function} callback Called when the operation is completed (error, result)
    save: (params, callback) ->
        @_method = 'save'
        id = params.id
        data = params.data || {}
        return callback error: 'InvalidId' if id is null or id != data._id
        options = params.options || {}
        validate = options.validate ? true
        match = options.match ? true
        idWithPrefix = "#{@_keyPrefix}#{id}"

        afterValidate = (error = null) =>
            return callback(error) if error?

            if match and @_validate?
                matched = @_validator.match data
                return callback name: 'MatchFailed', fields: matched unless matched is true

            @_addType data
            @_addLastUpdate data
            @_addId data, id

            @_dataSource.bucket.replace idWithPrefix, data, options, (error, result) ->
                return callback error if error?
                return callback null, result

        if validate and @_validate?
            @_validator.validate data, afterValidate
        else
            afterValidate()

    exist: (params, callback) ->
        @_method = 'exist'
        callback error: 'InvalidId' if params.id is null
        idWithPrefix = "#{@_keyPrefix}#{params.id}"
        options = params.options || {}
        expiry = options.expiry || 0
        @_dataSource.bucket.touch idWithPrefix, expiry, options, (error, result) ->
            return callback error if error?
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
    insert: (params, callback) ->
        @_method = 'insert'
        id = params.id || null
        data = params.data || {}
        options = params.options || {}
        validate = options.validate ? true
        match = options.match ? true

        afterId = (error, newId) =>
            return callback error if error
            newIdWithPrefix = "#{@_keyPrefix}#{newId}"

            afterValidate = (error = null) =>
                return callback error if error?

                if match and @_validate?
                    matched = @_validator.match data
                    return callback name: 'MatchFailed', fields: matched unless matched is true

                @_addType data
                @_addCreatedAt data
                @_addId data, newId

                @_dataSource.bucket.insert newIdWithPrefix, data, options, (error, result) ->
                    return callback error if error?
                    result.meta =
                        id: newId
                    return callback null, result

            if validate and @_validate?
                @_validator.validate data, afterValidate
            else
                afterValidate()

        if id is null
            afterId null, @_uuid() if @_autoId is 'uuid'
            @_counter afterId if @_autoId is 'counter'
            return callback error: 'InvalidId' if @_autoId isnt 'uuid' and @_autoId isnt 'counter'
        else
            return callback error: 'ManualIdNotAllowed' if !@_manualId and @_autoId isnt ''
            afterId null, id

    upsert: (params, callback) ->
        @_method = 'insert'
        id = params.id || null
        data = params.data || {}
        options = params.options || {}
        validate = options.validate ? true
        match = options.match ? true

        afterId = (error, newId) =>
            return callback error if error
            newIdWithPrefix = "#{@_keyPrefix}#{newId}"

            afterValidate = (error = null) =>
                return callback error if error?

                if match and @_validate?
                    matched = @_validator.match data
                    return callback name: 'MatchFailed', fields: matched unless matched is true

                @_addType data
                @_addCreatedAt data
                @_addId data, newId

                @_dataSource.bucket.upsert newIdWithPrefix, data, options, (error, result) ->
                    return callback error if error?
                    result.meta =
                        id: newId
                    return callback null, result

            if validate and @_validate?
                @_validator.validate data, afterValidate
            else
                afterValidate()

        if id is null
            afterId null, @_uuid() if @_autoId is 'uuid'
            @_counter afterId if @_autoId is 'counter'
            return callback error: 'InvalidId' if @_autoId isnt 'uuid' and @_autoId isnt 'counter'
        else
            return callback error: 'ManualIdNotAllowed' if !@_manualId and @_autoId isnt ''
            afterId null, id

    # Finds a single record using the specified conditions (Facade to findAll)
    find: (params, callback) ->
        @_method = 'find'
        params.limit = 1
        @findAll params, callback

    # Finds several records using the specified conditions
    findAll: (params, callback) ->
        @_method = 'findAll'
        $ = @component 'QueryBuilder', true
        conditions = params.conditions || ''
        unless params.fields?
            builder = $.selectStarFrom @_dataSource.bucket._name
        else
            builder = $.select params.fields
            builder.from @_dataSource.bucket._name
        builder.where builder.and conditions, builder.equal '_type', builder.value @_type
        builder.groupBy params.groupBy if params.groupBy?
        if params.orderBy?
            if params.orderBy.fields? and params.orderBy.direction?
                builder.orderBy params.orderBy.fields, params.orderBy.direction
            else
                builder.orderBy params.orderBy.fields
        builder.having params.having if params.having?
        builder.limit params.limit if params.limit?
        sql = builder.build()

        @_query sql, callback

#    # Issues a query to the database (just a wrapper)
#    # @param
#    query: (query, params, callback) ->
#        @_query query, callback
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
