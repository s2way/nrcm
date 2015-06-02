expect = require 'expect.js'
path = require 'path'
Message = require './../../../src/Component/Builtin/Message'

describe 'Message.js', ->

    describe 'get', ->
        it 'should return an object with the original message if no config has found', ->
            instance = new Message()
            expect(instance.get('my_test', 1)).to.be.equal 'my_test'

        it 'should set lang if its passed', ->

            langCalled = false

            instance = new Message()
            instance.tc =
                translate: () ->
                lang: ()->
                    langCalled = true
            instance.get('message', 0, 'newLang')
            expect(langCalled).to.be.ok()
