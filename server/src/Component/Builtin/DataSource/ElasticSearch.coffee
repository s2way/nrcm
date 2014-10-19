Exceptions = require("../../../Util/Exceptions")

class ElasticSearch
    constructor: -> @_elasticsearch = require("elasticsearch")

    client: (dataSourceName) ->
        dataSourceName = dataSourceName or "default"
        dataSource = @core.dataSources[dataSourceName]
        throw new Exceptions.IllegalArgument("DataSource not found!") unless dataSource
        new @_elasticsearch.Client(
            host: dataSource.host + ":" + dataSource.port
            log: dataSource.log
        )

module.exports = ElasticSearch