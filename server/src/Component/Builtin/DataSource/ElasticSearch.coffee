Exceptions = require '../../../Util/Exceptions'
_ = require 'underscore'

class ElasticSearch
    constructor: ->
        @_elasticsearch = require 'elasticsearch'
        @_ejs = require 'elastic.js'

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

    query: (datasource, params, callback) ->

        options =
            index: params?.index || null
            type: params?.type || null
            body: params?.query || null

        success = (resp) ->
            callback null, resp

        error = (err) ->
            callback err

        es = @client datasource
        es.search options
        .then success, error

module.exports = ElasticSearch
