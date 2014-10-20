Exceptions = require './../../src/Util/Exceptions'
expect = require 'expect.js'

describe 'Exceptions.js', ->

    for exceptionClass of Exceptions
        describe(exceptionClass, ->
            message = 'exception message'
            describe '.name', ->
                it 'should contain the name of the class', ->
                    exceptionInstance = new Exceptions[exceptionClass](message)
                    expect(exceptionInstance.name).to.be(exceptionClass)

            describe '.message', ->
                it 'should contain the exception message', ->
                    exceptionInstance = new Exceptions[exceptionClass](message)
                    expect(exceptionInstance.message).to.be(message)
        ) if Exceptions.hasOwnProperty exceptionClass