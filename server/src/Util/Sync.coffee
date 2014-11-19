Exceptions = require './Exceptions'
fs = require 'fs'
path = require 'path'

class Sync

    ###*
    Copy a file from a place to another if the destination does not exist

    @method copyIfNotExists
    @param {string} src The source file
    @param {string} src The directory destination
    ###
    @copyIfNotExists: (src, dst) ->
        stats = undefined
        if fs.existsSync(dst)
            stats = fs.lstatSync(dst)
            throw new Exceptions.Fatal()  if stats.isDirectory()
            return false
        Sync.copy src, dst

    ###*
    Copy a file from a place to another

    @method copy
    @param {string} src The source file
    @param {string} src The directory destination
    ###
    @copy: (src, dst) ->
        Sync.createFileIfNotExists dst, fs.readFileSync(src, "utf8")
        true


    ###*
    Load all files specified in a Array

    @method loadNodeFilesIntoArray
    @param {object} files A key-value JSON with the target key and the complete file name
    ###
    @loadNodeFilesIntoArray: (files) ->
        jsonFiles = {}
        throw new Exceptions.Fatal()  if typeof files isnt "object"
        filePath = undefined
        fileId = undefined
        for fileId of files
            if files.hasOwnProperty(fileId)
                filePath = files[fileId]
                jsonFiles[fileId] = require(fs.realpathSync(filePath))
        jsonFiles

    ###*
    Check if the directory exists, if doesn't try to create

    @method createDirIfNotExists
    @param {string} dir The dir that needs to be created
    ###
    @createDirIfNotExists: (dir) ->
        stats = undefined
        permission = parseInt("0766", 8)
        if fs.existsSync(dir)
            stats = fs.lstatSync(dir)
            throw new Exceptions.Fatal(dir + " exists and is not a directory")  unless stats.isDirectory()
        else
            fs.mkdirSync dir, permission
        return

    ###*
    Check if the file exists, if doesn't try to create

    @method createFileIfNotExists
    @param {string} filePath The file path that needs to be created
    @param {string} filePath The content of the file
    ###
    @createFileIfNotExists: (filePath, fileData) ->
        stats = undefined
        if fs.existsSync(filePath)
            stats = fs.lstatSync(filePath)
            throw new Exceptions.Fatal(filePath + " is not a file")  unless stats.isFile()
        else
            fs.writeFileSync filePath, fileData
        return


    ###*
    Return a list of files inside a given folder (recursive)

    @method listFilesFromDir
    @param {string} path Path to be searched
    @return {Array} Returns a list of files
    ###
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

    ###*
    Check if is a file

    @method isFile
    @param {string} fileNameWithPath The file full path to check
    @return {boolean} Returns true if it is a file
    ###
    @isFile: (fileNameWithPath) ->
        if fs.existsSync(fileNameWithPath)
            stats = fs.lstatSync(fileNameWithPath)
            return true  if stats.isFile()
        false

module.exports = Sync