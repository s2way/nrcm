_ = require 'underscore'
fs = require 'fs'
path = require 'path'
expect = require 'expect.js'
App = require './../src/App'

describe 'App.coffee', ->

    waferPie =
        paths:
            root: path.resolve './'
        hostname: '__host_test_cfg'
        Files: {}

    app = null
    appName = '__test__app'

    it 'should throw an exception if application name is invalid', ->
        # Dependency mock
        waferPie.Files =
            syncDirStructure: ->
            checkPath: ->
                true
            isFile: ->
                false
        expect( ->
            new App '', waferPie
        ).to.throwException((e) ->
            expect(e.name).to.be('Fatal')
            expect(e.message).to.be(App.ERROR_INVALID_NAME)
        )

    it 'should use the machine hostname as configuration file if it exists', ->
        # Dependency mock
        waferPie.Files =
            syncDirStructure: ->
            checkPath: ->
                true
            isFile: ->
                true
            listFilesFromDir: ->
            arrayOfFiles2JSON: ->
            loadNodeFiles: ->
                load = {}
                load[waferPie.hostname] = {}
        app = new App appName, waferPie
        waferPie.Files.isFile = (name) ->
            name.indexOf(waferPie.hostname) > 0
        app.deploy()
        expect(app.coreName).to.eql waferPie.hostname

    describe 'deploy', ->

        it 'should create the app directory structure if it does not exist', ->
            # Dependency mock
            waferPie.Files =
                syncDirStructure: ->
                checkPath: ->
                    true
                isFile: ->
                    false
                listFilesFromDir: ->
                arrayOfFiles2JSON: ->
                loadNodeFiles: ->
            expect(->
                app = new App appName, waferPie
                app.deploy()
            ).not.throwException()

        it 'should load all files in config dir to @configs[file]', ->
            expectedResult =
                core:
                    config: 1
                otherCfg:
                    anotherConfig: 1
            # Dependency mock
            waferPie.Files =
                syncDirStructure: ->
                checkPath: ->
                    true
                isFile: ->
                    false
                listFilesFromDir: ->
                arrayOfFiles2JSON: ->
                loadNodeFiles: ->
                    return expectedResult
            app = new App appName, waferPie
            app.deploy()
            expect(JSON.stringify app.configs).to.eql JSON.stringify expectedResult

        it 'should throw an exception if the folder structure is invalid', ->
            # Dependency mock
            waferPie.Files =
                syncDirStructure: ->
                checkPath: ->
                    false
                isFile: ->
                    false
                listFilesFromDir: ->
                arrayOfFiles2JSON: ->
                loadNodeFiles: ->
            expect( ->
                app = new App appName, waferPie
                app.deploy()
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be(App.ERROR_INVALID_PATH)
            )
