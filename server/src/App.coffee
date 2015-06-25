###
    Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
    Apache2 Licensed
###

# Dependencies
require('better-require')()
_ = require 'underscore'
path = require 'path'
Sync = require './Util/Sync'
Exceptions = require './Util/Exceptions'

class App

    # Directory structure
    @DIR_NAME_SRC: 'src'
    @DIR_NAME_TEST: 'test'
    @DIR_NAME_MODEL: 'model'
    @DIR_NAME_CONFIG: 'config'
    @DIR_NAME_FILTER: 'filter'
    @DIR_NAME_COMPONENT: 'component'
    @DIR_NAME_CONTROLLER: 'controller'
    @DIR_REGEX_CHECK: ///^\b[a-z_]+\b$///

    # Exceptions
    @ERROR_INVALID_NAME: "Application name is invalid. Accepted #{App.DIR_REGEX_CHECK}"
    @ERROR_INVALID_PATH: 'Folder structure is invalid.'

    # Build with the given name
    constructor: (@appName, @_waferPie) ->
        # Check app name
        throw new Exceptions.Fatal App.ERROR_INVALID_NAME unless @appName.match App.DIR_REGEX_CHECK

        # Map folder structure
        rootPath = path.resolve path.join @_waferPie.paths.root, @appName
        rootPathSrc =  path.join rootPath, App.DIR_NAME_SRC
        rootPathTest = path.join rootPath, App.DIR_NAME_TEST
        @paths =
            root: rootPath
            src:
                root: rootPathSrc
                config: path.join rootPathSrc, App.DIR_NAME_CONFIG
                model: path.join rootPathSrc, App.DIR_NAME_MODEL
                filter: path.join rootPathSrc, App.DIR_NAME_FILTER
                component: path.join rootPathSrc, App.DIR_NAME_COMPONENT
                controller: path.join rootPathSrc, App.DIR_NAME_CONTROLLER
            test:
                root: rootPathTest
                model: path.join rootPathTest, App.DIR_NAME_MODEL
                filter: path.join rootPathTest, App.DIR_NAME_FILTER
                component: path.join rootPathTest, App.DIR_NAME_COMPONENT
                controller: path.join rootPathTest, App.DIR_NAME_CONTROLLER
    ##
    # Create app folder structure if does not exist
    # Once it touches your FS you MUST never run as root
    ##
    pathSync: ->
#        try
        _.map @paths, (value) ->
            if _.isString value
                Sync.createDirIfNotExists value
            else
                _.map value, (value) ->
                    Sync.createDirIfNotExists value if _.isString value
#            Sync.createDirIfNotExists value
#        catch e
 #           throw new Exceptions.Fatal App.ERROR_INVALID_PATH, e

module.exports = App
