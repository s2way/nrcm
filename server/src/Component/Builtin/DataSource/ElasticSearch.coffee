Exceptions = require '../../../Util/Exceptions'

class ElasticSearch
    constructor: -> @_elasticsearch = require 'elasticsearch'

    client: (dataSourceInfo = 'default') ->
        if typeof dataSourceInfo is 'string'
            dataSource = @core.dataSources[dataSourceInfo]
        else
            dataSource = dataSourceInfo
        throw new Exceptions.IllegalArgument('DataSource not found!') unless dataSource
        new @_elasticsearch.Client(
            host: dataSource.host + ':' + dataSource.port
            log: dataSource.log
            keepAlive: false
        )

module.exports = ElasticSearch
