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
        Sync: {}

    app = null
    appName = '__test__app'

    it 'should throw an exception if application name is invalid', ->
        # Dependency mock
        waferPie.Sync =
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
        waferPie.Sync =
            syncDirStructure: ->
            checkPath: ->
                true
            isFile: ->
                true
        app = new App appName, waferPie
        expect(app._files.config.indexOf(waferPie.hostname) > 0).to.be.ok()

    describe 'build', ->

        it 'should create the app directory structure if it does not exist', ->
            # Dependency mock
            waferPie.Sync =
                syncDirStructure: ->
                checkPath: ->
                    true
                isFile: ->
                    false
            expect(->
                app = new App appName, waferPie
                app.build()
            ).not.throwException()

        it 'should throw an exception if the folder structure is invalid', ->
            # Dependency mock
            waferPie.Sync =
                syncDirStructure: ->
                checkPath: ->
                    false
                isFile: ->
                    false
            expect( ->
                app = new App appName, waferPie
                app.build()
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be(App.ERROR_INVALID_PATH)
            )
