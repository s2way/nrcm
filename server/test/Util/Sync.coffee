###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

# Dependencies
fs = require 'fs'
path = require 'path'
_ = require 'underscore'
expect = require 'expect.js'
Sync = require './../../src/Util/Sync'
Exceptions = require './../../src/Util/Exceptions'

describe 'Sync.js', ->

    root = path.resolve path.join '.', path.sep
    permission = parseInt('766', 8)
    fileNameToCreate = '_removeMe.log'
    fileNameCodeToCreate = '_removeMe'
    extCodeToCreate = '.js'
    fileCodeToCreate = fileNameCodeToCreate + extCodeToCreate
    fileToCreate = path.join root, fileNameToCreate
    fileToCopy = path.join root, '_removeMe2.log'
    appNameToCreate = '__test__app'
    dirToCreate = path.join root, appNameToCreate
    fileContents = 'áéíóúâêîôûàèìòùãẽĩõũçÇ/?€®ŧ←↓→øþæßðđŋħł«»©nµ'
    # Map folder structure
    rootPath = dirToCreate
    rootPathSrc =  path.join rootPath, 'src'
    rootPathTest = path.join rootPath, 'test'
    # MUST BE in alphabetic order
    paths =
        root: rootPath
        src:
            root: rootPathSrc
            component: path.join rootPathSrc, 'component'
            config: path.join rootPathSrc, 'config'
            controller: path.join rootPathSrc, 'controller'
            filter: path.join rootPathSrc, 'filter'
            model: path.join rootPathSrc, 'model'
        test:
            root: rootPathTest
            component: path.join rootPathTest, 'component'
            controller: path.join rootPathTest, 'controller'
            filter: path.join rootPathTest, 'filter'
            model: path.join rootPathTest, 'model'

    _toRemove = ->
        toRemove = []
        _.map paths, (value) ->
            if _.isString value
                toRemove.push value
            else
                _.map value, (value) ->
                    toRemove.push value if _.isString value
        toRemove

    # You must add here all files that you created manually running tests
    _clearStructure = ->
        try
            fs.unlinkSync fileToCreate
        try
            fs.unlinkSync fileToCopy
        try
            fs.rmdirSync dirToCreate

        # Remove the test structure
        toRemove = _toRemove()

        # Reverse order to delete otherwise rm will fail it won't be empty
        for obj in toRemove.reverse()
            do (obj) ->
                try
                    fs.unlinkSync path.join obj, fileNameToCreate
                try
                    fs.unlinkSync path.join obj, fileCodeToCreate
                try
                    fs.rmdirSync obj
                try
                    fs.unlinkSync obj

    after ->
        _clearStructure()

    beforeEach ->
        _clearStructure()

    describe 'checkPath', ->

        it 'should return false if it does not exist', ->
            expect(Sync.checkPath paths).not.be.ok()

        it 'should return true if it exists', ->
            Sync.syncDirStructure paths
            expect(Sync.checkPath paths).to.be.ok()

    describe 'createFileIfNotExists', ->

        it 'create the file if it does not exists', ->
            Sync.createFileIfNotExists fileToCreate
            expect(fs.existsSync(fileToCreate)).to.be.ok()

        it 'create the file with the content', ->
            Sync.createFileIfNotExists fileToCreate, fileContents
            expect(fs.existsSync(fileToCreate)).to.be.ok()
            expect(fs.readFileSync(fileToCreate).toString()).to.eql fileContents

        it 'should throw an exception if destination already exists', ->
            Sync.createFileIfNotExists fileToCreate
            expect(->
                Sync.createFileIfNotExists fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be('DestinationAlreadyExists')
                expect(e.message).to.be(Sync.ERROR_DST_EXISTS)
            )

    describe 'isFile', ->

        it 'should return false if the file does not exist or if it exists but it is not a file', ->
            expect(Sync.isFile('/this/path/must/not/exist/please')).not.be.ok()

        it 'should return true if the file exists', ->
            Sync.createFileIfNotExists fileToCreate
            expect(Sync.isFile(fileToCreate)).to.be.ok()

    describe 'copyIfNotExists', ->

        it 'should copy the file if it does not exist', ->
            Sync.createFileIfNotExists fileToCreate, fileContents
            Sync.copyIfNotExists fileToCreate, fileToCopy
            expect(fs.readFileSync(fileToCopy).toString()).to.eql fileContents

        it 'should throw an exception if the destination exists', ->
            Sync.createFileIfNotExists fileToCopy
            Sync.createFileIfNotExists fileToCreate
            expect(->
                Sync.copyIfNotExists fileToCopy, fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be('DestinationAlreadyExists')
                expect(e.message).to.be(Sync.ERROR_DST_EXISTS)
            )

        it 'should throw an exception if the source does not exist or it is not a file', ->
            expect(->
                Sync.copyIfNotExists fileToCopy, fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be('FileNotFound')
                expect(e.message).to.be(Sync.ERROR_NO_SRC_FILE)
            )

        it 'should throw an exception if the source it is not a file', ->
            # Dir instead of file
            fs.mkdirSync dirToCreate, permission
            expect(->
                Sync.copyIfNotExists dirToCreate, fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be('FileNotFound')
                expect(e.message).to.be(Sync.ERROR_NO_SRC_FILE)
            )

    describe 'createDirIfNotExists', ->

        it 'create the dir if it does not exists', ->
            Sync.createDirIfNotExists dirToCreate
            expect(fs.existsSync(dirToCreate)).to.be.ok()

        it 'should throw an exception if destination already exists', ->
            Sync.createDirIfNotExists dirToCreate
            expect(->
                Sync.createDirIfNotExists dirToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be('DestinationAlreadyExists')
                expect(e.message).to.be(Sync.ERROR_DST_EXISTS)
            )

    describe 'syncDirStructure', ->

        it 'should create the app directory structure if it does not exist', ->
            expect(Sync.syncDirStructure paths).to.eql _toRemove()
            # 2nd time there are all directories,so should return empty
            expect(Sync.syncDirStructure paths).to.eql []

    describe 'listFilesFromDir', ->

        it 'should return an array with the files inside dir structure', ->
            expectedFileList = []
            _.map (Sync.syncDirStructure paths), (value) ->
                file = path.join value, fileNameToCreate
                Sync.createFileIfNotExists file
                expectedFileList.push file
            expect(Sync.listFilesFromDir rootPath).to.eql expectedFileList

        it 'should return an empty list when the dir is empty', ->
            expect(Sync.listFilesFromDir rootPath).to.be.empty()

    describe 'loadNodeFilesIntoArray', ->

        it 'should the node files into an array', ->
            _.map (Sync.syncDirStructure paths), (value) ->
                file = path.join value, fileCodeToCreate
                Sync.createFileIfNotExists file, 'module.exports = { };'
            fileList = Sync.listFilesFromDir appNameToCreate
            jsonList = {}
            expectedReturn = {}
            _.map fileList, (value) ->
                key = value.substr(0, value.length - extCodeToCreate.length)
                jsonList[key] = value
                expectedReturn[key] = {}
            expect(JSON.stringify Sync.loadNodeFiles jsonList).to.eql JSON.stringify expectedReturn
