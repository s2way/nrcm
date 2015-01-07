Exceptions = require '../../../Util/Exceptions'

class MySQL
    @static = true

    # MySQL DataSource component
    # @param {string} dataSourceName The name of the DataSource defined in the application core.yml
    # @constructor
    constructor: (@_dataSourceName = 'default') ->
        @_mysql = require 'mysql'
        @_connections = {}
        @_databaseSelected = {}

    # Component initialization
    init: ->
        @_logger = @component 'Logger', 'mysql.log'

    # Logging method
    # @param {string} msg The log message
    info: (msg) ->
        @_logger.init()
        @_logger.log "[MySQL] #{msg}"

    # Connects to the database or returns the same connection object
    # @param callback Calls the callback passing an error or the connection object if successful
    # @private
    _connect: (dataSourceName, callback) ->
        dataSource = @core.dataSources[dataSourceName]
        throw new Exceptions.IllegalArgument("Couldn't find data source #{dataSourceName}. Take a look at your core.yml.") unless dataSource

        if @_connections[dataSourceName]
            @info "[#{dataSourceName}] Connection reused"
            callback null, @_connections[dataSourceName]
            return

        @info "[#{dataSourceName}] Connecting to #{dataSource.host}:#{dataSource.port}"
        connection = @_mysql.createConnection(
            host: dataSource.host
            port: dataSource.port
            user: dataSource.user
            password: dataSource.password
        )
        @info "[#{dataSourceName}] User: #{dataSource.user}"
        @info "[#{dataSourceName}] Password: #{dataSource.password}"
        connection.connect (error) =>
            if error
                callback error
            else
                @_connections[dataSourceName] = connection
                @info "[#{dataSourceName}] Connected"
                callback null, connection
            return
        return

    # Shutdowns the connection
    destroy: ->
        dataSourceName = undefined
        @info 'Shutting down connections...'
        for dataSourceName of @_connections
            if @_connections.hasOwnProperty(dataSourceName)
                @_connections[dataSourceName].end()
                @info "[#{dataSourceName}] Closed"
                delete @_connections[dataSourceName]

    # Issues a query to the MySQL server
    # @param {string} query The query (you can use the QueryBuilder component to build it)
    # @param {array} params An array of parameters that will be used to replace the query placeholders (?)
    # @param {function} callback The function that will be called when the operation has been completed
    query: (query, params, dataSourceNameOrCallback, callback) ->
        dataSourceName = dataSourceNameOrCallback
        if typeof dataSourceNameOrCallback is 'function'
            callback = dataSourceNameOrCallback
            dataSourceName = @_dataSourceName

        @_connect dataSourceName, (error, connection) =>
            return callback(error) if error
            @_selectDatabase dataSourceName, (error) =>
                return callback(error) if error
                @info "[#{dataSourceName}] Query: #{query}"
                connection.query query, params, callback

    _selectDatabase: (dataSourceName, callback) ->
        dataSource = @core.dataSources[dataSourceName]
        throw new Exceptions.IllegalArgument("Couldn't find data source #{dataSourceName}. Take a look at your core.yml.") unless dataSource

        unless @_databaseSelected[dataSourceName]
            @use dataSource.database, dataSourceName, (error) =>
                if error
                    callback error
                    return
                @_databaseSelected[dataSourceName] = true
                callback()
                return
            return
        callback()

    # Selects a database to be used
    # @param {string} database The name of the database
    # @param {function} callback The function that will be called when the operation has been completed
    use: (database, dataSourceNameOrCallback, callback) ->
        dataSourceName = dataSourceNameOrCallback
        if typeof dataSourceNameOrCallback is 'function'
            callback = dataSourceNameOrCallback
            dataSourceName = @_dataSourceName

        @_connect dataSourceName, (error, connection) =>
            return callback(error) if error
            connection.query "USE #{connection.escapeId(database)};", (error) =>
                @info "[#{dataSourceName}] Database selected: #{database}"
                return callback(error) if error
                return callback()

    # Call a procedure passing the specified parameters
    # @param {string} procedure The procedure name
    # @param {array} params An array of parameters that will be passed to the procedure
    # @param {function} callback Function called when the operation has been completed
    call: (procedure, params, dataSourceNameOrCallback, callback) ->
        dataSourceName = dataSourceNameOrCallback
        if typeof dataSourceNameOrCallback is 'function'
            callback = dataSourceNameOrCallback
            dataSourceName = @_dataSourceName

        throw new Exceptions.IllegalArgument('The procedure parameter is mandatory')  if typeof procedure isnt 'string'
        @_connect dataSourceName, (error, connection) =>
            if error
                return callback error
            @_selectDatabase dataSourceName, (error) ->
                if error
                    return callback error
                paramsString = ''
                i = 0
                while i < params.length
                    paramsString += ', '  if paramsString isnt ''
                    paramsString += '?'
                    i += 1
                connection.query "CALL #{connection.escapeId(procedure)}(#{paramsString})", params, callback

module.exports = MySQL