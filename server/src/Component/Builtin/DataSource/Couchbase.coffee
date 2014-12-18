Exceptions = require('../../../Util/Exceptions')

class Couchbase
    constructor: (dataSourceName) ->
        dataSourceName = dataSourceName or 'default'
        @_couchbase = require('couchbase')
        @_dataSourceName = dataSourceName
        @view = @_couchbase.ViewQuery
        @n1ql = require('couchbase').N1q1Query


    # Component initialization
    # Check if the data source specified in the constructor exists
    init: ->
        @_dataSource = @core.dataSources[@_dataSourceName]
        throw new Exceptions.IllegalArgument "Couldn't find data source #{@_dataSourceName}. Take a look at your core.json." unless @_dataSource
        @bucketName = @_dataSource.bucket
        @cluster = new @_couchbase.Cluster "#{@_dataSource.host}:#{@_dataSource.port}"
        @bucket = @cluster.openBucket @bucketName

    # Close the database connection
    destroy: ->
        @bucket?.disconnect?()

module.exports = Couchbase
