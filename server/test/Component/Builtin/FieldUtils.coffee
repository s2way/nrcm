'use strict'

expect = require 'expect.js'
path = require 'path'
FieldUtils = require './../../../src/Component/Builtin/FieldUtils'

describe 'FieldUtils', ->

    fieldUtils = new FieldUtils()

    describe 'isUseful()', ->

        it 'should return false to an empty string', ->
            result = fieldUtils.isUseful ''
            expect(result).not.to.be.ok()

        it 'should return false to an undefined string', ->
            result = fieldUtils.isUseful undefined
            expect(result).not.to.be.ok()

        it 'should return false to a null', ->
            result = fieldUtils.isUseful null
            expect(result).not.to.be.ok()

        it 'should return true to a zero', ->
            result = fieldUtils.isUseful 0
            expect(result).to.be.ok()

        it 'should return true to a ten', ->
            result = fieldUtils.isUseful 10
            expect(result).to.be.ok()

        it 'should return false to an empty array', ->
            result = fieldUtils.isUseful []
            expect(result).not.to.be.ok()

        it 'should return true to a populated array', ->
            result = fieldUtils.isUseful [1,2]
            expect(result).to.be.ok()

        it 'should return false to an empty object', ->
            result = fieldUtils.isUseful {}
            expect(result).not.to.be.ok()

        it 'should return true to a populated object', ->
            result = fieldUtils.isUseful {id:15}
            expect(result).to.be.ok()

        it 'should return false to a false boolean', ->
            result = fieldUtils.isUseful false
            expect(result).not.to.be.ok()

        it 'should return true to a true boolean', ->
            result = fieldUtils.isUseful true
            expect(result).to.be.ok()

        it 'should return true to a zero float', ->
            result = fieldUtils.isUseful 0.0
            expect(result).to.be.ok()

        it 'should return true to a zero float', ->
            result = fieldUtils.isUseful 0.000000000
            expect(result).to.be.ok()

        it 'should return true to a zero float', ->
            result = fieldUtils.isUseful 0.000000001
            expect(result).to.be.ok()

        it 'should return true to a one float', ->
            result = fieldUtils.isUseful 1.0
            expect(result).to.be.ok()

    describe 'dateFormat', ->

        it 'should return formatted date', ->
            result = fieldUtils.dateFormat '2015-03-17T12:03:43.000Z'
            expect(result).to.be '2015-03-17T12:03:43+00:00'

        it 'should return the original value if it is invalid', ->
            result = fieldUtils.dateFormat '2015-03-17 12:63:03'
            expect(result).to.be '2015-03-17 12:63:03'

        it 'should return the original value if it is invalid', ->
            result = fieldUtils.dateFormat 'invalid date'
            expect(result).to.be 'invalid date'

        it 'should return an empty string', ->
            result = fieldUtils.dateFormat ''
            expect(result).to.be ''

        it 'should return a null object', ->
            result = fieldUtils.dateFormat null
            expect(result).to.be null

    describe 'dateFormatSQL', ->

        it 'should return formatted date', ->

            timezone =  ((((new Date()).getTimezoneOffset() * -1) /60) * 100)

            if timezone > -1000 and timezone < 0
                timezone = '-0' + (timezone * -1)
            else if timezone is 0
                timezone = 'Z'
            else if timezone > 0 and timezone < 1000
                timezone = '+0' + timezone
            else if timezone >= 1000
                timezone = '+' + timezone

            result = fieldUtils.dateFormatSQL '2015-03-17T12:03:43.000' + timezone
            expect(result).to.be '2015-03-17 11:03:43'

        it 'should return the original value if it is invalid', ->
            result = fieldUtils.dateFormatSQL 'invalid date'
            expect(result).to.be 'invalid date'

        it 'should return an empty string', ->
            result = fieldUtils.dateFormatSQL ''
            expect(result).to.be ''

        it 'should return a null object', ->
            result = fieldUtils.dateFormatSQL null
            expect(result).to.be null

    describe 'isNullTimestamp', ->

        it 'should return true if the timestamp is 0000-00-00 00:00:00', ->
            result = fieldUtils.isNullTimestamp '0000-00-00 00:00:00'
            expect(result).to.be.ok()

        it 'should return false if the timestamp isnt 0000-00-00 00:00:00', ->
            result = fieldUtils.isNullTimestamp '2015-01-01 00:00:00'
            expect(result).not.to.be.ok()

        it 'should return true if the timestamp is null', ->
            result = fieldUtils.isNullTimestamp null
            expect(result).to.be.ok()

    describe 'plate', ->

        it 'should return a string without special characters', ->
            result = fieldUtils.plate '!@#AA-A_9*/-9+.9)(*&9'
            expect(result).to.eql 'AAA9999'

        it 'should return null if the value is null', ->
            result = fieldUtils.plate null
            expect(result).to.eql null
