chalk = require("chalk")
path = require("path")
fs = require("fs")

###*
Logger component constructor
@param fileName The name of the file where the logs are going to be stored
@constructor
###
class Logger
    constructor: (fileName) ->
        @_fileName = fileName or "default.log"
        @_enabled = true
        @_stream = null
        @_configs = console: false
        @singleInstance = true

    ###*
    Set the logger configurations
    @param {object} configs
    ###
    config: (configs) ->
        @_configs = configs


    ###*
    Initializes the component
    @param {string=} logsPath
    ###
    init: ->
        logsPath = undefined
        logsPath = @_configs.path or path.join(@constants.logsPath)
        @fullPath = path.join(logsPath, @_fileName)

    ###*
    Print the message to the buffer
    @private
    ###
    _print: (message) ->
        @_stream = fs.createWriteStream(@fullPath,
            flags: "a+"
            encoding: "UTF8"
        )
        @_stream.write message + "\n"
        @_stream.end()
        console.log message  if @_configs.console is true


    ###*
    Format the message before printing it
    @param {string} message The message to be formatted
    @returns {string} The formatted message
    @private
    ###
    _format: (message) ->
        new Date().toISOString() + ": " + message


    ###*
    Enable the logs
    ###
    enable: ->
        @_enabled = true

    ###*
    Disable the logs
    ###
    disable: ->
        @_enabled = false

(->
    loggingMethods =
        info: "blue"
        log: null
        trace: null
        error: "red"
        warn: "yellow"
        debug: "green"

    logFunction = (color) ->
        (message) ->
            text = message
            if @_enabled
                text = chalk[color](message)  if color isnt null
                @_print @_format(text)
            return

    for methodName of loggingMethods
        if loggingMethods.hasOwnProperty(methodName)
            color = loggingMethods[methodName]
            Logger::[methodName] = logFunction(color)
)()

module.exports = Logger