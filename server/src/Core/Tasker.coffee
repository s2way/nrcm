require 'coffee-script/register'
require('better-require')()
path = require 'path'
events = require 'events'
ElementManager = require './../Core/ElementManager'
Loader = require './../Util/Loader'
sync = require './../Util/Sync'

EXEC_NAME = 'execName'
EXEC_INTERVAL = 'execInterval'
EXEC_RUN = 'exec'
EXEC_INFO = 'execInfo'
LOG_EVERY = 'execLogEvery'
FAILS_TO_WARN = 'execFailsToWarn'
FAILS_TO_ERROR = 'execFailsToError'

class Tasker
    @_requiredAttributes = [EXEC_NAME, EXEC_INTERVAL]
    @_requiredFunctions = [EXEC_RUN]

    constructor: (@_app, @_serverLogger) ->
        @_coreElementManager = new ElementManager @_app
        @_timers =[]
        @tasks = 0

    run: ->
        @_validateTasks @_app.components
        @tasks

    _log: (message) ->
        @_serverLogger?.log? message

    _validateTasks: (tasks) ->
        for name, Task of tasks
            instance = @_coreElementManager.create 'component', name
            _shouldSkip = false

            Tasker._requiredAttributes.forEach (attr) ->
                unless instance[attr]?
                    _shouldSkip = true

            Tasker._requiredFunctions.forEach (attr) ->
                unless instance[attr] instanceof Function
                    _shouldSkip = true

            continue if _shouldSkip

            @_launchTask instance

    _launchTask: (task) ->
        name = task[EXEC_NAME]
        interval = task[EXEC_INTERVAL]
        run = EXEC_RUN

        @tasks++

        task.__failsToWarn = task[FAILS_TO_WARN] || 0
        task.__failsToError = task[FAILS_TO_ERROR] || 0
        task.__logEvery = task[LOG_EVERY] || 0
        task.__logTrigger = 0
        task.__failCounter = 0
        task.__successCounter = 0
        task.__status = 0
        task.__isLocked = false
        task.__emiter = new events.EventEmitter

        task.__emiter.addListener 'success', ->
            task.__successCounter++
            task.__isLocked = false

        task.__emiter.addListener 'error', ->
            task.__failCounter++
            task.__status = 1 if task.__failCounter >= task.__failsToWarn and task.__status is 0
            task.__status = 2 if task.__failCounter >= task.__failsToError and task.__status is 1
            task.__isLocked = false

        @_log "Task: [#{name}] was registered. [every = #{interval}]"

        @_timers.push setInterval (@_logger) ->
            task.__logTrigger++

            if task.__logTrigger >= task.__logEvery
                @_logger?.log? "Task: [#{name}] was invoked. [#{task.__logTrigger}]"
                task.__logTrigger = 0

            unless task.__isLocked
                task.__isLocked = true
                task[run](task.__emiter)
        , interval, @_serverLogger

module.exports = Tasker
