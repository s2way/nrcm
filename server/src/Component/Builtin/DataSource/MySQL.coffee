Exceptions = require("../../../Util/Exceptions")

class MySQL
    # MySQL DataSource component
    # @param {string} dataSourceName The name of the DataSource defined in the application core.json
    # @constructor
    constructor: (dataSourceName) ->
        @_mysql = require("mysql")
        @_dataSourceName = dataSourceName
        @_connections = {}
        @_databaseSelected = {}
        @_dataSourceName = "default"  unless dataSourceName
    @singleInstance = true

    # Component initialization
    # Validates if the DataSource exists
    init: ->
        @_dataSource = @core.dataSources[@_dataSourceName]
        throw new Exceptions.IllegalArgument("Couldn't find datasource '" + @_dataSourceName + "'. Take a look at your core.json.")  unless @_dataSource

    # Changes the DataSource (connection properties) being used internally
    # @param {string} dataSourceName The name of the DataSource, as specified in the core.json file
    setDataSource: (dataSourceName) ->
        @_dataSourceName = dataSourceName
        @_dataSource = @core.dataSources[@_dataSourceName]

    # Logging method
    # @param {string} msg The log message
    info: (msg) ->
        logger = @component("Logger")
        logger.init()
        logger.log "[MySQL] " + msg

    # Connects to the database or returns the same connection object
    # @param callback Calls the callback passing an error or the connection object if successful
    # @private
    _connect: (callback) ->
        if @_connections[@_dataSourceName]
            @info "[" + @_dataSourceName + "] Recycling connection"
            callback null, @_connections[@_dataSourceName]
            return
        connection = undefined
        $this = undefined
        $this = this
        @info "[" + @_dataSourceName + "] Connecting to " + @_dataSource.host + ":" + @_dataSource.port
        connection = @_mysql.createConnection(
            host: @_dataSource.host
            port: @_dataSource.port
            user: @_dataSource.user
            password: @_dataSource.password
        )
        connection.connect (error) ->
            if error
                callback error
            else
                $this._connections[$this._dataSourceName] = connection
                $this.info "[" + $this._dataSourceName + "] Connected"
                callback null, connection
            return

        return


    # Shutdowns the connection
    destroy: ->
        $this = this
        (shutdownConnection = ->
            dataSourceName = undefined
            $this.info "Shutting down connections..."
            for dataSourceName of $this._connections
                if $this._connections.hasOwnProperty(dataSourceName)
                    $this._connections[dataSourceName].end()
                    $this.info "[" + dataSourceName + "] Closed"
                    delete $this._connections[dataSourceName]
            return
        )()

    # Issues a query to the MySQL server
    # @param {string} query The query (you can use the QueryBuilder component to build it)
    # @param {array} params An array of parameters that will be used to replace the query placeholders (?)
    # @param {function} callback The function that will be called when the operation has been completed
    query: (query, params, callback) ->
        $this = this
        @_connect (error, connection) ->
            if error
                callback error
                return
            $this._selectDatabase (error) ->
                if error
                    callback error
                    return
                connection.query query, params, callback
                return

            return

        return

    _selectDatabase: (callback) ->
        $this = this
        unless $this._databaseSelected[$this._dataSourceName]
            $this.use $this._dataSource.database, (error) ->
                if error
                    callback error
                    return
                $this._databaseSelected[$this._dataSourceName] = true
                callback()
                return

            return
        callback()

    # Selects a database to be used
    # @param {string} database The name of the database
    # @param {function} callback The function taht will be called when the operation has been completed
    use: (database, callback) ->
        @_connect (error, connection) ->
            if error
                return callback error
            connection.query "USE " + connection.escapeId(database) + ";", (error) ->
                if error
                    return callback error
                return callback()

    # Call a procedure passing the specified parameters
    # @param {string} procedure The procedure name
    # @param {array} params An array of parameters that will be passed to the procedure
    # @param {function} callback Function called when the operation has been completed
    call: (procedure, params, callback) ->
        throw new Exceptions.IllegalArgument("The procedure parameter is mandatory")  if typeof procedure isnt "string"
        $this = this
        @_connect (error, connection) ->
            if error
                return callback error
            $this._selectDatabase (error) ->
                if error
                    return callback error
                i = undefined
                paramsString = ""
                i = 0
                while i < params.length
                    paramsString += ", "  if paramsString isnt ""
                    paramsString += "?"
                    i += 1
                connection.query "CALL " + connection.escapeId(procedure) + "(" + paramsString + ")", params, callback

module.exports = MySQL