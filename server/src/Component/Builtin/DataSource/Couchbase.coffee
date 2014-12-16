Exceptions = require('../../../Util/Exceptions')

class Couchbase
    constructor: (dataSourceName) ->
        dataSourceName = dataSourceName or 'default'
        @_couchbase = require('couchbase')
        @_dataSourceName = dataSourceName
        @_viewQuery = @_couchbase.ViewQuery
        @_cluster = null
        @_db = null

    # Component initialization
    # Check if the data source specified in the constructor exists
    init: ->
        @_dataSource = @core.dataSources[@_dataSourceName]
        throw new Exceptions.IllegalArgument("Couldn't find data source #{@_dataSourceName}. Take a look at your core.json.")  unless @_dataSource

    # Connects to the database or returns the bucket object
    # @param {function} callback
    connect: (callback) ->
        @_cluster = new @_couchbase.Cluster("#{@_dataSource.host}:#{@_dataSource.port}") if @_cluster is null
        @_db = @_cluster.openBucket(@_dataSource.bucket) if @_db is null
        @_db.on 'connect', (error) =>
            callback error, @_db

        @_db.on 'error', (error) ->
            callback error

    # Close the database connection
    destroy: ->
        @_db?.disconnect()?

module.exports = Couchbase
