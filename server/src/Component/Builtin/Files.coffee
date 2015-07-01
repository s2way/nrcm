###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

# Dependencies
fs = require 'fs'
path = require 'path'
_ = require 'underscore'
Exceptions = require './../../Util/Exceptions'

# Class overwrite
require('better-require')()

class Files

    # Exceptions
    @ERROR_DST_EXISTS: 'Destination already exists.'
    @ERROR_NO_SRC_FILE: 'Source is missing or it is not a file.'
    @ERROR_NOT_JSON: 'File content is not a valid JSON'

    # Defaults
    @DEFAULT_PERM_FILE: 766
    @DEFAULT_PERM_DIR: 766
    @DEFAULT_ENCODING: 'utf8'

    # Transform a array of files into a JSON object
    @arrayOfFiles2JSON: (files, withPath) ->
        result = {}
        _.map files, (value) ->
            basename = path.basename value
            extension = path.extname value
            keyWithoutPath = basename.substr 0, basename.length - extension.length
            keyWithPath = value.substr 0, value.length - extension.length
            if withPath
                key = keyWithPath
            else
                key = keyWithoutPath
            result[key] = value
        result

    # Transform a file into a JSON object if is possible
    @file2JSON: (file) ->
        throw new Exceptions.FileNotFound Files.ERROR_NO_SRC_FILE unless Files.isFile file
        try
            # Remove from cache to ensure the loading
            delete require.cache[file]
            result = require file
            JSON.parse JSON.stringify result
        catch e
            throw new Exceptions.Fatal Files.ERROR_NOT_JSON, e

    # Check for the presence of files
    # returns false if one in the list does not exist
    @checkPath: (paths, result = false) ->
        try
            _.map paths, (value) ->
                if _.isString value
                    result = fs.existsSync value
                    return result unless result
                else
                    Files.checkPath value, result
        result

    # Create a file if destination does not exist
    @createFileIfNotExists: (to, content, encoding = Files.DEFAULT_ENCODING, mode = Files.DEFAULT_PERM_FILE) ->
        throw new Exceptions.DestinationAlreadyExists Files.ERROR_DST_EXISTS if fs.existsSync to
        fs.writeFileSync to, content,
            mode: parseInt mode, 8
            encoding: encoding

    # Check if the directory exists, if does not try to create it
    @createDirIfNotExists: (dir, mode = Files.DEFAULT_PERM_DIR) ->
        throw new Exceptions.DestinationAlreadyExists Files.ERROR_DST_EXISTS if fs.existsSync dir
        fs.mkdirSync dir, parseInt mode, 8

    # Check if is a file
    @isFile: (file) ->
        stats = fs.lstatSync file if fs.existsSync file
        stats?.isFile()

    # Copy a file from a place to another if the destination does not exist and the source exists
    @copyIfNotExists: (from, to, encoding = Files.DEFAULT_ENCODING, mode = Files.DEFAULT_PERM_FILE) ->
        throw new Exceptions.FileNotFound Files.ERROR_NO_SRC_FILE unless @isFile from
        Files.createFileIfNotExists to, fs.readFileSync from, encoding, mode

    # Create directory structure if does not exist, if exists leave it
    # returns an array with the structure created
    @syncDirStructure: (paths, mode = Files.DEFAULT_PERM_DIR, result = []) ->
        try
            _.map paths, (value) ->
                if _.isString value
                    Files.createDirIfNotExists value, mode
                    result.push value
                else
                    Files.syncDirStructure value, mode, result
        result

    # Return an Array with the list of files inside a given folder (recursive)
    @listFilesFromDir: (dir = '', result = []) ->
        files = fs.readdirSync dir if fs.existsSync dir
        _.map files, (value) ->
            obj = path.join dir, value
            # obj could be deleted
            stats = fs.lstatSync obj if fs.existsSync obj
            result.push obj if stats?.isFile()
            Files.listFilesFromDir obj, result if stats?.isDirectory()
        result

    # Load all files
    # @param {object} files A key-value JSON with the target key and the complete file name
    @loadNodeFiles: (files = {}) ->
        result = {}
        _.map files, (value, key) ->
            result[key] = require fs.realpathSync value
        result

module.exports = Files
