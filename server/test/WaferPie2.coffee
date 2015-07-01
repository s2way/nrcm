###
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
# Apache2 Licensed
###

# Dependencies
fs = require 'fs'
path = require 'path'
expect = require 'expect.js'
WaferPie = require './../src/WaferPie2'
Files = require './../src/Component/Builtin/Files'

expect = require 'expect.js'

describe 'WaferPie.js', ->

    wafer = null
    root = path.resolve path.join '.', path.sep
    fileNameToCreate = '__remove_me.yml'
    fileToCreate = path.join root, fileNameToCreate

    # You must add here all files that you created manually running tests
    _clearStructure =  ->
        try
            fs.unlinkSync fileToCreate

    beforeEach ->
        _clearStructure()
        wafer = new WaferPie

    after ->
        _clearStructure()

    describe 'configure', ->

        it 'should load the config', ->
            Files.createFileIfNotExists fileToCreate, 'urlFormat: "/$application/$controller"'
            expect( ->
                wafer.configure fileToCreate
            ).not.to.throwException()

        it 'should throw a Fatal exception if the config file is not a valid configuration file', ->
            Files.createFileIfNotExists fileToCreate, '{ { } '
            expect( ->
                wafer.configure fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.eql 'Fatal'
                expect(e.message).to.eql WaferPie.ERROR_INVALID_CONFIG_FILE
            )

        it 'should throw a Fatal exception if the urlFormat is not a string or it is not defined', ->
            Files.createFileIfNotExists fileToCreate, 'urlFormat: 1'
            expect( ->
                wafer.configure fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be 'Fatal'
                expect(e.message).to.eql WaferPie.ERROR_INVALID_CONFIG_PARAMETER
            )
