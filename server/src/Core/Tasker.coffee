require 'coffee-script/register'
require('better-require')()
path = require 'path'
events = require 'events'
sync = require('waferpie').Sync
Loader = require('waferpie').Loader

EXEC_NAME = 'execName'
EXEC_INTERVAL = 'execInterval'
EXEC_RUN = 'exec'
EXEC_INFO = 'execInfo'
FAILS_TO_WARN = 'failsToWarn'
FAILS_TO_ERROR = 'failsToError'

class Tasker
    @_requiredAttributes = [EXEC_NAME, EXEC_INTERVAL]
    @_requiredFunctions = [EXEC_RUN]

    _validateTasks: (tasks) ->

        for name, Task of tasks
            instance = new Task
            _shallContinue = false
            Exec._requiredAttributes.forEach (attr) ->
                unless instance[attr]?
                    delete tasks[attr]
                    # TODO use logger component
                    console.log "Task: [#{name}] was dropped. attribute #{attr} was not found."
                    _shallContinue = true
            Exec._requiredFunctions.forEach (attr) ->
                unless instance[attr] instanceof Function
                    delete tasks[name]
                    # TODO use logger component
                    console.log "Task: [#{name}] was dropped. function #{attr} was not found."
                    _shallContinue = true

            continue if _shallContinue
            # TODO use logger component
            @_launchTask instance

    _launchTask: (task) ->
        name = task[EXEC_NAME]
        interval = task[EXEC_INTERVAL]
        run = EXEC_RUN
        task.__failsToWarn = task[FAILS_TO_WARN] || 0
        task.__failsToError = task[FAILS_TO_ERROR] || 0
        task.__failCounter = 0
        task.__successCounter = 0
        task.__status = 0
        task.__isLocked = false
        task.__emiter = new events.EventEmitter

        task.__emiter.addListener 'success', ->
            console.log 'listener success reported'
            task.__successCounter++
            console.log task.__status
            task.__isLocked = false

        task.__emiter.addListener 'error', ->
            console.log 'listener error reported'
            task.__failCounter++
            task.__status = 1 if task.__failCounter >= task.__failsToWarn and task.__status is 0
            task.__status = 2 if task.__failCounter >= task.__failsToError and task.__status is 1
            console.log task.__status
            task.__isLocked = false

        # TODO use logger component
        console.log "Task: [#{name}] was registered. [every = #{interval}]"

        @_timers.push setInterval ->
            # TODO use logger component
            console.log "Task: [#{name}] was invoked. [warn = #{task.__failsToWarn}] [error = #{task.__failsToError}]"
            unless task.__isLocked
                task.__isLocked = true
                task[run](task.__emiter)
        , interval

    constructor: (taskComponents) ->
        @_timers =[]
        @_validateTasks @taskComponents

module.exports = Tasker
