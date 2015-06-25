AppFactory = require './../src/App'
path = require 'path'
sync = require './../src/Util/Sync'
fs = require 'fs'
expect = require 'expect.js'

describe 'App.coffee', ->

    app = null
    appName = 'myTestApp'

    clearStructure = (dir) ->
        fs.rmdirSync path.join dir, 'src', 'Component'
        fs.rmdirSync path.join dir, 'src', 'Controller'
        fs.unlinkSync path.join dir, 'src', 'Config', 'core.yml'
        fs.rmdirSync path.join dir, 'src', 'Config'
        fs.rmdirSync path.join dir, 'src', 'Filter'
        fs.rmdirSync path.join dir, 'src', 'Model'
        fs.rmdirSync path.join dir, 'src'
        fs.rmdirSync path.join dir, 'test', 'Component'
        fs.rmdirSync path.join dir, 'test', 'Controller'
        fs.rmdirSync path.join dir, 'test', 'Filter'
        fs.rmdirSync path.join dir, 'test', 'Model'
        fs.rmdirSync path.join dir, 'test'
        fs.rmdirSync path.join dir, 'logs'
        fs.rmdirSync dir

    before ->
        clearStructure appName

    beforeEach ->
        app = new App appName

    afterEach ->
        clearStructure appName

    describe 'pathSync', ->

        it 'should create the app directory structure if it does not exist', ->
            app.pathSync()
            expect(fs.existsSync(path.join(app.path.src, 'controller'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.src, 'component'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.src, 'config', 'core.yml'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.src, 'filter'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.src, 'model'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.test, 'controller'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.test, 'component'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.test, 'filter'))).to.be.ok()
            expect(fs.existsSync(path.join(app.path.test, 'model'))).to.be.ok()
