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
Files = {}

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

    # Names
    @FILE_EXT_DEFAULT: '.yml'
    @FILE_NAME_CORE_DEFAULT: 'core'

    # Configs
    @CORE_VERSION = 'version'
    @CORE_REQUEST_TIMEOUT = 'requestTimeout'

    # Exceptions
    @ERROR_INVALID_NAME: "Application name is invalid. Accepted #{App.DIR_REGEX_CHECK}"
    @ERROR_INVALID_PATH: 'Folder structure is invalid.'

    # Build with the given name
    constructor: (@appName, @_waferPie) ->

        # Injectable dependencies
        @Files = @_waferPie.Files

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

        # core is decided on build load defaults
        @coreName = ''
        @coreFile = ''

        # Shared object
        @limbo = {}

        # Config & all configs
        @core = {}
        @configs = {}

    ##
    # Create app folder structure if does not exist
    # Once it touches your FS you MUST never run as root
    ##
    deploy: ->
        # Check paths & files
        @Files.syncDirStructure @_paths
        throw new Exceptions.Fatal(App.ERROR_INVALID_PATH) unless @Files.checkPath @_paths
        # Import configs
        @_setupConfigs()

    # Load all files in config object & Decides the core config to use
    _setupConfigs: ->
        coreDefault = path.join @_paths.src.config, App.FILE_NAME_CORE_DEFAULT + App.FILE_EXT_DEFAULT
        coreHostname = path.join @_paths.src.config, @_waferPie.hostname + App.FILE_EXT_DEFAULT

        # Load all configs
        filesInConfigDir = @Files.listFilesFromDir @_paths.src.config
        keyValueToLoad = @Files.arrayOfFiles2JSON filesInConfigDir
        @configs = @Files.loadNodeFiles keyValueToLoad

        # Overwrite with the hostname.yml if it exists in config directory
        if @Files.isFile coreHostname
            @coreFile = coreHostname
            @coreName = @_waferPie.hostname
            @core = @configs[@coreName]
        else
            if @Files.isFile coreDefault
                @coreFile = coreDefault
                @coreName = App.FILE_NAME_CORE_DEFAULT
                @core = @configs[@coreName]

        # Setup defaults
        @core[App.CORE_VERSION] = '1.0.0' unless @core['Version']
        @core[App.CORE_REQUEST_TIMEOUT] = '10000' unless @core['Version']

        @configs

module.exports = App
