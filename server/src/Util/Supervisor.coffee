timers = require 'timers'
ElasticSearch = require '../Component/Builtin/DataSource/ElasticSearch'
SystemInfo = require '../Component/Builtin/SystemInfo'

DEFAULT_INTERVAL = 5

# Supervisor uses ElasticSearch to record the server health
class Supervisor
    constructor: (@_logger, @_config, @_monitoring) ->
        @_isRunning = false
        @_si = new SystemInfo
        @_el = new ElasticSearch

    _log: (message) ->
        @_logger?.log?('[Supervisor] ' + message + ' ' + @_monitoring.requests + ' ' + @_monitoring.responseAvg)

    _runner: (name, ctx, callback) ->
        now = new Date().toISOString()
        data = ctx._si.variable()
        data['@timestamp'] = now
        data.requests = ctx._monitoring.requests
        data.responseAvg = ctx._monitoring.responseAvg
        ctx._log 'Health check at ' + now
        ctx._es.index
            index: ctx._config.dataSource.index or 'waferpie'
            id: ctx._config.nodeName + '_' + now
            type: ctx._config.nodeName
            body: data
            , (error, response) ->
                if error
                    ctx._log error
                else
                    ctx._monitoring.requests = 0
                    ctx._monitoring.responseAvg = 0.00
        callback?()

    _connect: ->
        @_es = @_el.client @_config.dataSource

    run: (callback) ->
        unless @_isRunning
            if @_config is undefined
                @_log 'No info for monitoring'
            else if @_config.nodeName is undefined
                @_log 'Config nodeName is invalid'
            else if @_config.dataSource is undefined
                @_log 'Config dataSourceName is invalid'
            else
                @_connect()
                if @_es
                    @_config.intervalInSeconds = @_config.intervalInSeconds or DEFAULT_INTERVAL
                    @_isRunning = timers.setInterval @_runner, @_config.intervalInSeconds * 1000, @_config.nodeName, @, callback
                else
                    @_log 'Datasource unable to be created'

    stop: ->
        if @_isRunning
            timers.clearInterval @_isRunning
            @_isRunning = false

module.exports = Supervisor
