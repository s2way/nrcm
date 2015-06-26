###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

# Dependencies
Exceptions = require './Exceptions'
fs = require 'fs'
path = require 'path'

class Sync

    # Exceptions
    @ERROR_DST_EXISTS: 'Destination already exists.'
    @ERROR_NO_SRC_FILE: 'Source is missing or it is not a file.'

    # Defaults
    @DEFAULT_MODE: 666
    @DEFAULT_ENCODING: 'utf8'

    # Copy a file from a place to another if the destination does not exist
    @copyIfNotExists: (from, to, encoding = Sync.DEFAULT_ENCODING, mode = Sync.DEFAULT_MODE) ->
        stats = fs.lstatSync from if fs.existsSync from
        Sync.createFileIfNotExists toFile, fs.readFileSync from, encoding

    # Create a file if destination does not exist
    @createFileIfNotExists: (toFile, fileContents, encoding = Sync.DEFAULT_ENCODING, mode = Sync.DEFAULT_MODE) ->
        throw new Exceptions.Fatal(Sync.ERROR_DST_EXISTS) if fs.existsSync toFile
        fs.writeFileSync toFile, fileContents,
            mode: parseInt(mode, 8)
            encoding: encoding

    # Load all files specified in a Array
    # @method loadNodeFilesIntoArray
    # @param {object} files A key-value JSON with the target key and the complete file name
    @loadNodeFilesIntoArray: (files) ->
        jsonFiles = {}
        throw new Exceptions.Fatal()  if typeof files isnt "object"
        for fileId of files
            if files.hasOwnProperty(fileId)
                filePath = files[fileId]
                jsonFiles[fileId] = require(fs.realpathSync(filePath))
        jsonFiles

    # Check if the directory exists, if doesn't try to create
    # @method createDirIfNotExists
    # @param {string} dir The dir that needs to be created
    @createDirIfNotExists: (dir) ->
        permission = parseInt('766', 8)
        if fs.existsSync(dir)
            stats = fs.lstatSync(dir)
            throw new Exceptions.Fatal(dir + " exists and is not a directory")  unless stats.isDirectory()
        else
            fs.mkdirSync dir, permission

    # Return a list of files inside a given folder (recursive)
    # @method listFilesFromDir
    # @param {string} path Path to be searched
    # @return {Array} Returns a list of files
    @listFilesFromDir: (dir) ->
        files = fs.readdirSync(dir)
        result = []
        if files.length > 0
            files.forEach (file) ->
                fullFilePath = path.join(dir, file)
                stats = fs.lstatSync(fullFilePath)
                stats = fs.lstatSync(fs.realpathSync(fullFilePath))  if stats.isSymbolicLink()
                if stats.isFile()
                    result.push fullFilePath
                else result = result.concat(Sync.listFilesFromDir(fullFilePath))  if stats.isDirectory()
                return
        result

    # Check if is a file
    # @method isFile
    # @param {string} fileNameWithPath The file full path to check
    # @return {boolean} Returns true if it is a file
    @isFile: (fileNameWithPath) ->
        if fs.existsSync(fileNameWithPath)
            stats = fs.lstatSync(fileNameWithPath)
            return true  if stats.isFile()
        false

module.exports = Sync
