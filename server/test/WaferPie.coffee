WaferPie = require './../src/WaferPie'
assert = require 'assert'
path = require 'path'
sync = require './../src/Util/Sync'
fs = require 'fs'
expect = require 'expect.js'

describe 'WaferPie.js', ->

    clearStructure = (dir) ->
        fs.rmdirSync(path.join(dir, 'src', 'Component'))
        fs.rmdirSync(path.join(dir, 'src', 'Controller'))
        fs.unlinkSync(path.join(dir, 'src', 'Config', 'core.json'))
        fs.rmdirSync(path.join(dir, 'src', 'Config'))
        fs.rmdirSync(path.join(dir, 'src', 'Filter'))
        fs.rmdirSync(path.join(dir, 'src', 'Model'))
        fs.rmdirSync(path.join(dir, 'src'))

        fs.rmdirSync(path.join(dir, 'test', 'Component'))
        fs.rmdirSync(path.join(dir, 'test', 'Controller'))
        fs.rmdirSync(path.join(dir, 'test', 'Filter'))
        fs.rmdirSync(path.join(dir, 'test', 'Model'))
        fs.rmdirSync(path.join(dir, 'test'))

        fs.rmdirSync(path.join(dir, 'logs'))

        fs.unlinkSync('Exceptions.js')
        fs.rmdirSync(dir)

    wafer = null

    beforeEach ->
        wafer = new WaferPie
        wafer.logger =
            log: -> return
            info: -> return
            debug: -> return

    describe 'start', ->

        it 'should throw a Fatal exception if configure() was not called before', ->
            expect( ->
                wafer.start()
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
            )

    describe 'configure', ->

        it 'should load the configs without throwing an exception', ->
            configFileName = 'invalid_config.json'
            sync.createFileIfNotExists(configFileName, '{ "urlFormat": "/$application/$controller" }')
            wafer.configure configFileName
            fs.unlinkSync(configFileName)

        it 'should throw a Fatal exception if the config file is not a valid JSON file', ->
            configFileName = 'config_test.json'
            sync.createFileIfNotExists(configFileName, 'this is not a json file')
            expect( ->
                wafer.configure(configFileName)
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be('Configuration file is not a valid configuration file')
            )
            fs.unlinkSync(configFileName)

        it 'should throw a Fatal exception if the urlFormat is not a string or it is not defined', ->
            configFileName = 'config_test.json'
            sync.createFileIfNotExists(configFileName, '{}')
            expect( ->
                wafer.configure(configFileName)
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be('urlFormat has not been specified or it is not a string')
            )
            fs.unlinkSync(configFileName)

        it 'should throw a Fatal exception if the core configuration file is not a valid JSON', ->
            sync.createDirIfNotExists(path.join('testing'))
            sync.createDirIfNotExists(path.join('testing', 'src'))
            sync.createDirIfNotExists(path.join('testing', 'src', 'Config'))
            sync.createFileIfNotExists(path.join('testing', 'src', 'Config', 'core.json'), '')

            expect( ->
                wafer.setUp('testing')
                assert.fail()
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be('The core configuration file is not a valid JSON')
            )
            clearStructure 'testing'

    it 'should start the application', ->
        sync.createDirIfNotExists(path.join('testing1'))
        sync.createDirIfNotExists(path.join('testing1', 'src'))
        sync.createDirIfNotExists(path.join('testing1', 'src', 'Controller'))
        sync.createDirIfNotExists(path.join('testing1', 'src', 'Component'))

        controllerFile = path.join('testing1', 'src', 'Controller', 'MyController.js')
        sync.createFileIfNotExists(controllerFile, 'module.exports = function () { }')
        componentFile = path.join('testing1', 'src', 'Component', 'MyComponent.js')
        sync.createFileIfNotExists(componentFile, 'module.exports = function () { }')

        wafer.setUp('testing1')
        wafer.configure()
        wafer.start()

        fs.unlinkSync(path.join('testing1', 'src', 'Controller', 'MyController.js'))
        fs.unlinkSync(path.join('testing1', 'src', 'Component', 'MyComponent.js'))
        clearStructure 'testing1'

    it 'should create the default internal structure', ->
        wafer.setUp('testing2')
        expect(fs.existsSync(path.join('testing2', 'src', 'Controller'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'src', 'Component'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'src', 'Config', 'core.json'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'src', 'Filter'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'src', 'Model'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'test', 'Controller'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'test', 'Component'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'test', 'Filter'))).to.be.ok()
        expect(fs.existsSync(path.join('testing2', 'test', 'Model'))).to.be.ok()
        expect(fs.existsSync(path.join('Exceptions.js'))).to.be.ok()
        clearStructure 'testing2'

    it 'should throw a Fatal exception if the controller does not export a function', ->
        sync.createDirIfNotExists(path.join('testing3'))
        sync.createDirIfNotExists(path.join('testing3', 'src'))
        sync.createDirIfNotExists(path.join('testing3', 'src', 'Controller'))
        controllerFile = path.join('testing3', 'src', 'Controller', 'MyController.js')
        sync.createFileIfNotExists(controllerFile, '{}')
        expect( ->
            wafer.setUp('testing3')
            assert.fail()
        ).to.throwException((e) ->
            expect(e.name).to.be('Fatal')
            expect(e.message).to.be('Controller does not export a function: MyController')
        )
        fs.unlinkSync(controllerFile)
        clearStructure 'testing3'

    it 'should throw a Fatal exception if the model does not export a function', ->
        sync.createDirIfNotExists(path.join('testing4'))
        sync.createDirIfNotExists(path.join('testing4', 'src'))
        sync.createDirIfNotExists(path.join('testing4', 'src', 'Model'))
        modelFile = path.join('testing4', 'src', 'Model', 'MyModel.js')
        sync.createFileIfNotExists(modelFile, '{}')
        expect( ->
            wafer.setUp('testing4')
            assert.fail()
        ).to.throwException((e) ->
            expect(e.name).to.be('Fatal')
            expect(e.message).to.be('Model does not export a function: MyModel')
        )
        fs.unlinkSync(modelFile)
        clearStructure 'testing4'

    it 'should throw a Fatal exception if the component does not export a function', ->
        sync.createDirIfNotExists(path.join('testing5'))
        sync.createDirIfNotExists(path.join('testing5', 'src'))
        sync.createDirIfNotExists(path.join('testing5', 'src', 'Controller'))
        sync.createDirIfNotExists(path.join('testing5', 'src', 'Component'))
        componentFile = path.join('testing5', 'src', 'Component', 'MyComponent.js')
        sync.createFileIfNotExists(componentFile, '{}')
        expect( ->
            wafer.setUp('testing5')
            assert.fail()
        ).to.throwException((e) ->
            expect(e.name).to.be('Fatal')
            expect(e.message).to.be('Component does not export a function: MyComponent')
        )
        fs.unlinkSync(componentFile)
        clearStructure 'testing5'

    it 'should throw a Fatal exception if the controller method is not a function', ->
        sync.createDirIfNotExists(path.join('testing6'))
        sync.createDirIfNotExists(path.join('testing6', 'src'))
        sync.createDirIfNotExists(path.join('testing6', 'src', 'Controller'))
        controllerFile = path.join('testing6', 'src', 'Controller', 'MyController.js')
        sync.createFileIfNotExists(controllerFile, 'module.exports = function (){ this.get = 1 }')
        expect( ->
            wafer.setUp('testing6')
            assert.fail()
        ).to.throwException((e) ->
            expect(e.name).to.be('Fatal')
            expect(e.message).to.be('MyController.get() must be a function!')
        )
        fs.unlinkSync(controllerFile)
        clearStructure 'testing6'

    describe 'setUp', ->

        it 'should throw a Fatal exception if the requestTimeout in is not a number', ->
            coreFile = path.join('testing7', 'src', 'Config', 'core.json')
            sync.createDirIfNotExists(path.join('testing7'))
            sync.createDirIfNotExists(path.join('testing7', 'src'))
            sync.createDirIfNotExists(path.join('testing7', 'src', 'Config'))
            sync.createFileIfNotExists(coreFile, '{ "requestTimeout": "string" }')

            expect( ->
                wafer.setUp('testing7')
                assert.fail()
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be('The requestTimeout configuration is not a number')
            )
            clearStructure 'testing7'

        it 'should throw a Fatal exception if the requestTimeout is not defined', ->
            coreFile = path.join('testing8', 'src', 'Config', 'core.json')
            sync.createDirIfNotExists(path.join('testing8'))
            sync.createDirIfNotExists(path.join('testing8', 'src'))
            sync.createDirIfNotExists(path.join('testing8', 'src', 'Config'))
            sync.createFileIfNotExists(coreFile, '{ }')

            expect( ->
                wafer.setUp('testing8')
                assert.fail()
            ).to.throwException((e) ->
                expect(e.name).to.be('Fatal')
                expect(e.message).to.be('The requestTimeout configuration is not defined')
            )
            clearStructure 'testing8'
