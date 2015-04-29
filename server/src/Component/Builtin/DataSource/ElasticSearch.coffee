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

    # findAll
    # params ->
    #   index: index to query into, all if null
    #   type:  type to query into, all if null
    #   filters: -> TermFilters (single or array)
    #       field: field to compare
    #       qstr: value to compare
    findAll: (datasource, params, callback) ->
        query = @_ejs.MatchAllQuery()
        filters = null

        if params?.filters
            filters = @_filter params.filters

        options =
            index: params?.index || null
            type: params?.type || null
            body: @_ejs.Request().query(query).filter(filters)

        success = (resp) ->
            callback null, resp

        error = (err) ->
            callback err

        es = @client datasource
        es.search options
        .then success, error 

    _filter: (filters) ->
        if _.isArray filters
            _filters = []
            _filters.push @_ejs.TermFilter filter.field, filter.qstr for filter in filters
            _filters = @_ejs.AndFilter(_filters)   
        else
            _filters = @_ejs.TermFilter filters.field, filters.qstr

        _filters

module.exports = ElasticSearch
