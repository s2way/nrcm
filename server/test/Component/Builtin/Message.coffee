expect = require 'expect.js'
path = require 'path'
Message = require './../../../src/Component/Builtin/Message'

describe 'Message.js', ->

    describe 'error', ->
        it 'should return an object with the original message if no config has found', ->
            message = new Message()
            expect(message.get("my_test", 1)).to.be.equal 'my_test'
