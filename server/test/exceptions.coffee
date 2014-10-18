exceptions = require './../src/exceptions.coffee'
expect = require 'expect.js'

describe 'exceptions.js', ->

    for exceptionClass of exceptions
        describe(exceptionClass, ->
            message = 'exception message'
            describe '.name', ->
                it 'should contain the name of the class', ->
                    exceptionInstance = new exceptions[exceptionClass](message)
                    expect(exceptionInstance.name).to.be(exceptionClass)

            describe '.message', ->
                it 'should contain the exception message', ->
                    exceptionInstance = new exceptions[exceptionClass](message)
                    expect(exceptionInstance.message).to.be(message)
        ) if exceptions.hasOwnProperty exceptionClass