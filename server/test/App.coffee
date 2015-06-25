_ = require 'underscore'
fs = require 'fs'
App = require './../src/App'
path = require 'path'
Sync = require './../src/Util/Sync'
expect = require 'expect.js'

describe 'App.coffee', ->

    mocks =
        waferpie:
            paths:
                root: path.resolve './'
    app = null
    appName = '__test__app'

    # Clear folder structure
    clearStructure = (appToClear) ->
        toRemove = []
        _.map appToClear.paths, (value) ->
            if _.isString value
                toRemove.push value
            else
                _.map value, (value) ->
                    toRemove.push value if _.isString value

        # Reverse order to delete otherwise rm will fail it won't be empty
        for folder in toRemove.reverse()
            do (folder) ->
                try
                    fs.rmdirSync folder

        # You must add here all files that you create manually
        try
            fs.unlinkSync appToClear.paths.root

    after ->
        clearStructure app

    beforeEach ->
        app = new App appName, mocks.waferpie
        clearStructure app

    it 'should throw an exception if application name is invalid', ->
        expect( ->
            noNameApp = new App '', mocks.waferpie
        ).to.throwException((e) ->
            expect(e.name).to.be('Fatal')
            expect(e.message).to.be(App.ERROR_INVALID_NAME)
        )

    describe 'sync', ->

        it 'should create the app directory structure if it does not exist', ->
            app.sync()
            _.map app.paths, (value) ->
                if _.isString value
                    expect(fs.existsSync(value)).to.be.ok()
                else
                    _.map value, (value) ->
                        expect(fs.existsSync(value)).to.be.ok() if _.isString value

        it 'should throw an exception if the folder structure is invalid', ->
            expect( ->
                fs.openSync app.paths.root, 'w+'
                app.sync()
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be(App.ERROR_INVALID_PATH)
            )
