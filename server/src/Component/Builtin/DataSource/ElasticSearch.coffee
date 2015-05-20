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
        es.search(options).then success, error

    # Get a typed JSON from the index based on its id
    get: (dataSource, params, callback) ->
        options =
            index: params?.index || null
            type: params?.type || null
            id: params?.id || 0

        @client(dataSource).get options, callback

    # Stores a typed JSON document in an index, making it searchable
    # If no id is passed, ES will assign one
    # This is an upsert-like function, use create() if you want unique document index control
    save: (dataSource, params, callback) ->
        options =
            index: params?.index || null
            type: params?.type || null
            body : params?.data || null

        options.id = params?.id if params?.id?

        @client(dataSource).index options, callback

    # Adds a typed JSON document in a specific index, making it searchable
    # If a document with the same index, type, and id already exists, an error will occur
    create: (dataSource, params, callback) ->
        options =
            index: params?.index || null
            type: params?.type || null
            id: params?.id || 0
            body : params?.data || null

        @client(dataSource).create options, callback

    refresh: (dataSource, index, callback) ->
        @client(dataSource).indices.refresh index : index, force : true, callback

    bulk: (dataSource, data, callback) ->
        @client(dataSource).bulk body : data, callback

    indexExists: (dataSource, index, callback) ->
        @client(dataSource).indices.exists index : index, callback

    createIndex: (dataSource, params, callback) ->
        @client(dataSource).indices.create params, callback

module.exports = ElasticSearch
