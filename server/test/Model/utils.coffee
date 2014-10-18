assert = require 'assert'
utils = require './../../src/Model/utils'

describe 'utils.js', ->
    describe 'merge', ->
        it 'should merge two different objects into one', ->
            to = {
                '3' : {
                    '3.5' : 3.5
                },
                '6' : 6,
                '7' : 7
            }
            from = {
                '1' : 1,
                '2' : 2,
                '3' : {
                    '4' : 4,
                    '5' : 5
                }
            }
            expectedResult = {
                '1' : 1,
                '2' : 2,
                '3' : {
                    '3.5' : 3.5,
                    '4' : 4,
                    '5' : 5
                },
                '6' : 6,
                '7' : 7
            }
            assert.equal(JSON.stringify(expectedResult), JSON.stringify(utils.merge(from, to)))
            assert.equal(JSON.stringify(expectedResult), JSON.stringify(utils.merge(to, from)))