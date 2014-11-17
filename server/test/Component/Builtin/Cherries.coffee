Cherries = require './../../../src/Component/Builtin/Cherries'
path = require 'path'
expect = require 'expect.js'

describe 'Cherries.js', ->

    instance = null

    beforeEach ->
        instance = new Cherries()

    describe 'elementNameToPath', ->
        it 'should return the right path for a given model name', ->
            expect(instance.elementNameToPath('Folder.SubFolder.MyModel')).to.be(path.join('Folder', 'SubFolder', 'MyModel'))
            expect(instance.elementNameToPath('MyModel')).to.be(path.join('MyModel'))

    describe 'copy', ->

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