Navigator = require './../../../src/Component/Builtin/Navigator'
expect = require 'expect.js'

describe 'Navigator.js', ->

    instance = null

    beforeEach ->
        instance = new Navigator()

    describe 'get', ->

        it 'should return undefined if the property does not exist', ->
            expect(instance.get({}, 'a.b.c.d')).to.be undefined

        it 'should return null if the parent property is null', ->
            expect(instance.get({'a' : null}, 'a.b')).to.be null

        it 'should return the value', ->
            expect(instance.get(a: b: 10, 'a.b')).to.be 10
