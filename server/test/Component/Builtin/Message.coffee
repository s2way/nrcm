expect = require 'expect.js'
path = require 'path'
Message = require './../../../src/Component/Builtin/Message'

describe 'Message.js', ->

    describe 'get', ->
        it 'should return an object with the original message if no config has found', ->
            instance = new Message()
            expect(instance.get('my_test', 1)).to.be.equal 'my_test'
