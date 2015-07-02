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
    appName = '__test__app'
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
            Files.createFileIfNotExists fileToCreate, "#{WaferPie.CONFIG_URL_FORMAT}: #{WaferPie.DEFAULT_URL_FORMAT}"
            expect( ->
                try
                    wafer.configure fileToCreate
                catch e
                    console.log wafer.config
                    console.log e
            ).not.to.throwException()

        it 'should throw an exception if the config file is not a valid configuration file', ->
            Files.createFileIfNotExists fileToCreate, '{ { } '
            expect( ->
                wafer.configure fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.eql 'Fatal'
                expect(e.message).to.eql WaferPie.ERROR_INVALID_CONFIG_FILE
            )

        it "should throw an exception if the #{WaferPie.CONFIG_URL_FORMAT} is not a string", ->
            Files.createFileIfNotExists fileToCreate, "#{WaferPie.CONFIG_URL_FORMAT}: 1"
            expect( ->
                wafer.configure fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be 'Fatal'
                expect(e.message).to.eql WaferPie.ERROR_INVALID_CONFIG_PARAMETER
            )

        it "should throw an exception if the #{WaferPie.CONFIG_LISTEN_ADDRESS} is not a string", ->
            Files.createFileIfNotExists fileToCreate, "#{WaferPie.CONFIG_LISTEN_ADDRESS}: 1"
            expect( ->
                wafer.configure fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be 'Fatal'
                expect(e.message).to.eql WaferPie.ERROR_INVALID_CONFIG_PARAMETER
            )

        it "should throw an exception if the #{WaferPie.CONFIG_LISTEN_FAMILY} is not a string", ->
            Files.createFileIfNotExists fileToCreate, "#{WaferPie.CONFIG_LISTEN_FAMILY}: 1"
            expect( ->
                wafer.configure fileToCreate
            ).to.throwException((e) ->
                expect(e.name).to.be 'Fatal'
                expect(e.message).to.eql WaferPie.ERROR_INVALID_CONFIG_PARAMETER
            )

    describe 'start', ->

        it 'should not throw an exception if it was configured ', ->
            expect( ->
                try
                    wafer.configure()
                catch e
                    console.log e
                wafer.start()
            ).not.to.throwException()

        it 'should throw an exception if it was not configured ', ->
            expect( ->
                wafer.start()
            ).to.throwException((e) ->
                expect(e.name).to.be 'Fatal'
                expect(e.message).to.eql WaferPie.ERROR_MISS_CONFIGURATION
            )
