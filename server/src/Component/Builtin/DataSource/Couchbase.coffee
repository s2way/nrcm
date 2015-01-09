Exceptions = require('../../../Util/Exceptions')

# The Couchbase DataSource uses the following definition
#
#<DataSourceName>
# type = Couchbase ** must be like this ** <DataSourceType>
# host = ** required <host>
# port = ** required <port>
# bucket = ** required <bucketName>
# n1qlHost: "127.0.0.1" <N1QL query language host>
# n1qlPort: 8093  <N1QL query language port>
#
#ephemeral:
#    type: "Couchbase"
#    host: "127.0.0.1"
#    port: 8091
#    bucket: "ephemeral"
#    n1qlHost: "127.0.0.1"
#    n1qlPort: 8093

class Couchbase

    constructor: (dataSourceName) ->
        dataSourceName = dataSourceName or 'default'
        @_couchbase = require 'couchbase'
        @_dataSourceName = dataSourceName
        @n1ql = require('couchbase').N1qlQuery

    # Component initialization
    # Check if the data source specified in the constructor exists
    init: ->
        @view = @_couchbase.ViewQuery if @view?
        @_dataSource = @core.dataSources[@_dataSourceName]
        throw new Exceptions.IllegalArgument "Couldn't find data source #{@_dataSourceName}. Take a look at your core.json." unless @_dataSource
        @bucketName = @_dataSource.bucket
        @cluster = new @_couchbase.Cluster "#{@_dataSource.host}:#{@_dataSource.port}"
        @bucket = @cluster.openBucket @bucketName
        @bucket.enableN1ql "#{@_dataSource.n1qlHost}:#{@_dataSource.n1qlPort}" if @_dataSource.n1qlPort?

    # Close the database connection
    destroy: ->
        @bucket?.disconnect?()

module.exports = Couchbase
