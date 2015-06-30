###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

# Dependencies
fs = require 'fs'
path = require 'path'
_ = require 'underscore'
Exceptions = require './Util/Exceptions'

# Expected dependencies
Sync = {}

class App

    # Directory structure defaults
    @DIR_NAME_SRC: 'src'
    @DIR_NAME_TEST: 'test'
    @DIR_NAME_MODEL: 'model'
    @DIR_NAME_CONFIG: 'config'
    @DIR_NAME_FILTER: 'filter'
    @DIR_NAME_COMPONENT: 'component'
    @DIR_NAME_CONTROLLER: 'controller'
    @DIR_REGEX_CHECK: ///^\b[a-z_]+\b$///

    @FILE_NAME_CONFIG_DEFAULT: 'config.yml'

    # Exceptions
    @ERROR_INVALID_NAME: "Application name is invalid. Accepted #{App.DIR_REGEX_CHECK}"
    @ERROR_INVALID_PATH: 'Folder structure is invalid.'

    # Build with the given name
    constructor: (@appName, @_waferPie) ->

        # Inject dependencies
        @Sync = @_waferPie.Sync

        # Check app name
        throw new Exceptions.Fatal App.ERROR_INVALID_NAME unless @appName.match App.DIR_REGEX_CHECK

        # Map folder structure
        rootPath = path.resolve path.join @_waferPie.paths.root, @appName
        rootPathSrc =  path.join rootPath, App.DIR_NAME_SRC
        rootPathTest = path.join rootPath, App.DIR_NAME_TEST
        @_paths =
            root: rootPath
            src:
                root: rootPathSrc
                component: path.join rootPathSrc, App.DIR_NAME_COMPONENT
                config: path.join rootPathSrc, App.DIR_NAME_CONFIG
                controller: path.join rootPathSrc, App.DIR_NAME_CONTROLLER
                filter: path.join rootPathSrc, App.DIR_NAME_FILTER
                model: path.join rootPathSrc, App.DIR_NAME_MODEL
            test:
                root: rootPathTest
                component: path.join rootPathTest, App.DIR_NAME_COMPONENT
                controller: path.join rootPathTest, App.DIR_NAME_CONTROLLER
                filter: path.join rootPathTest, App.DIR_NAME_FILTER
                model: path.join rootPathTest, App.DIR_NAME_MODEL

        configDefault = path.join @_paths.src.config, App.FILE_NAME_CONFIG_DEFAULT
        configHostname = path.join @_paths.src.config, @_waferPie.hostname

        # Overwrite with the hostname.yml if it exists in config directory
        configFile = configHostname if @Sync.isFile configHostname
        configFile = configDefault unless configFile

        @_files =
            config: configFile

        # Shared object
        @limbo = {}

    ##
    # Create app folder structure if does not exist
    # Once it touches your FS you MUST never run as root
    ##
    build: ->
        @Sync.syncDirStructure @_paths
        throw new Exceptions.Fatal(App.ERROR_INVALID_PATH) unless @Sync.checkPath @_paths

module.exports = App
