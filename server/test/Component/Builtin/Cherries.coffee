Cherries = require './../../../src/Component/Builtin/Cherries'
path = require 'path'
expect = require 'expect.js'

describe 'Cherries.js', ->

    instance = null

    beforeEach ->
        instance = new Cherries()

    describe 'elementNameToPath()', ->
        it 'should return the right path for a given model name', ->
            expect(instance.elementNameToPath('Folder.SubFolder.MyModel')).to.be(path.join('Folder', 'SubFolder', 'MyModel'))
            expect(instance.elementNameToPath('MyModel')).to.be(path.join('MyModel'))

    describe 'pathToElementName()', ->
        it 'should return the element name for a given model path', ->
            expect(instance.pathToElementName(path.join('Folder', 'SubFolder', 'MyModel.coffee'))).to.be('Folder.SubFolder.MyModel')
            expect(instance.pathToElementName(path.join('Folder', 'SubFolder', 'MyModel.js'))).to.be('Folder.SubFolder.MyModel')
            expect(instance.pathToElementName(path.join('Folder', 'SubFolder', 'MyModel'))).to.be('Folder.SubFolder.MyModel')
            expect(instance.pathToElementName('MyModel')).to.be(path.join('MyModel'))

    describe 'copy()', ->

        it 'should perform a deep copy of a json object removing unserializable properties', ->
            toCopy =
                a: [1, 'one']
                b: ['two', 2]
                c: -> 'three'
            copy = instance.copy(toCopy)
            expect(copy.a).to.be.an('array')
            expect(copy.b[0]).to.be('two')
            expect(copy.c).not.to.be.ok()
            expect(copy.a isnt toCopy.a).to.be(true)
            expect(copy.b isnt toCopy.b).to.be(true)

    describe 'isJSON()', ->

        it 'should return false if the param is not a JSON', ->
            expect(instance.isJSON true).to.be false
            expect(instance.isJSON false).to.be false
            expect(instance.isJSON null).to.be false
            expect(instance.isJSON undefined).to.be false
            expect(instance.isJSON '').to.be false
            expect(instance.isJSON 0).to.be false
            expect(instance.isJSON 1.1).to.be false
            expect(instance.isJSON ->).to.be false

        it 'should return true if the param is a valid JSON', ->
            expect(instance.isJSON {}).to.be true

    describe 'loadBuiltinComponents()', ->

        it 'should load and return all builtin components', ->
            components = instance.loadBuiltinComponents()
            expect(components.QueryBuilder).to.be.a('function')
