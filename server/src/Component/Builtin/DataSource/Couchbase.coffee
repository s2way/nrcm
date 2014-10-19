Exceptions = require("../../../Util/Exceptions")

class Couchbase
    constructor: (dataSourceName) ->
        dataSourceName = dataSourceName or "default"
        @_couchbase = require("couchbase")
        @_dataSourceName = dataSourceName
        @ViewQuery = @_couchbase.ViewQuery

    # Component initialization
    # Check if the data source specified in the constructor exists
    init: ->
        @_dataSource = @core.dataSources[@_dataSourceName]
        throw new Exceptions.IllegalArgument("Couldn't find data source '" + @_dataSourceName + "'. Take a look at your core.json.")  unless @_dataSource

    # Connects to the database or returns the bucket object
    # @param {function} callback
    connect: (callback) ->
        cluster = new @_couchbase.Cluster(@_dataSource.host + ":" + @_dataSource.port)
        db = cluster.openBucket(@_dataSource.bucket)
        db.on "connect", (error) ->
            callback error, db

        db.on "error", (error) ->
            callback error

module.exports = Couchbase