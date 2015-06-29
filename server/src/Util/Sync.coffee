###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

# Dependencies
fs = require 'fs'
path = require 'path'
_ = require 'underscore'
require('better-require')()
Exceptions = require './Exceptions'

class Sync

    # Exceptions
    @ERROR_DST_EXISTS: 'Destination already exists.'
    @ERROR_NO_SRC_FILE: 'Source is missing or it is not a file.'

    # Defaults
    @DEFAULT_PERM_FILE: 766
    @DEFAULT_PERM_DIR: 766
    @DEFAULT_ENCODING: 'utf8'

    # Create a file if destination does not exist
    @createFileIfNotExists: (to, content, encoding = Sync.DEFAULT_ENCODING, mode = Sync.DEFAULT_PERM_FILE) ->
        throw new Exceptions.DestinationAlreadyExists Sync.ERROR_DST_EXISTS if fs.existsSync to
        fs.writeFileSync to, content,
            mode: parseInt mode, 8
            encoding: encoding

    # Check if the directory exists, if does not try to create it
    @createDirIfNotExists: (dir, mode = Sync.DEFAULT_PERM_DIR) ->
        throw new Exceptions.DestinationAlreadyExists Sync.ERROR_DST_EXISTS if fs.existsSync dir
        fs.mkdirSync dir, parseInt mode, 8

    # Check if is a file
    @isFile: (file) ->
        stats = fs.lstatSync file if fs.existsSync file
        stats?.isFile()

    # Copy a file from a place to another if the destination does not exist and the source exists
    @copyIfNotExists: (from, to, encoding = Sync.DEFAULT_ENCODING, mode = Sync.DEFAULT_PERM_FILE) ->
        throw new Exceptions.FileNotFound Sync.ERROR_NO_SRC_FILE unless @isFile from
        Sync.createFileIfNotExists to, fs.readFileSync from, encoding, mode

    # Create directory structure if does not exist, if exists leave it
    # returns an array with the structure created
    @syncDirStructure: (paths, mode = Sync.DEFAULT_PERM_DIR, added = []) ->
        try
            _.map paths, (value) ->
                if _.isString value
                    Sync.createDirIfNotExists value, mode
                    added.push value
                else
                    Sync.syncDirStructure value, mode, added
        added

    # Return an Array with the list of files inside a given folder (recursive)
    @listFilesFromDir: (dir = '', result = []) ->
        files = fs.readdirSync dir
        _.map files, (value) ->
            obj = path.join dir, value
            stats = fs.lstatSync obj
            result.push obj if stats.isFile()
            Sync.listFilesFromDir obj, result if stats.isDirectory()
        result

    # Load all files specified in a Array
    # @param {object} files A key-value JSON with the target key and the complete file name
    @loadNodeFilesIntoArray: (files) ->
        jsonFiles = {}
        throw new Exceptions.Fatal() unless _.isObject files
        for fileId of files
            if files.hasOwnProperty(fileId)
                filePath = files[fileId]
                jsonFiles[fileId] = require(fs.realpathSync(filePath))
        jsonFiles

module.exports = Sync
