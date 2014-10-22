assert = require 'assert'
expect = require 'expect.js'
Request = require './../../src/Controller/Request'

describe 'Request', ->

    describe 'receive()', ->

        it 'should call the callback passing the payload as a JSON if the Content-Type is application/x-www-form-urlencoded', ->
            request = new Request(
                method: 'GET'
                headers:
                    'content-type': 'application/x-www-form-urlencoded'
                url: 'http://www.s2way.com:10000/resource/'
                on: (event, callback) ->
                    if event is 'data'
                        return callback 'this=is&a=payload'
                    if event is 'end'
                        callback()
            )
            request.receive (payload) ->
                expect(payload['this']).to.be 'is'
                expect(payload.a).to.be 'payload'

        it 'should call the callback passing the payload as a JSON if the Content-Type is text/xml', ->
            request = new Request(
                method: 'GET'
                headers:
                    'content-type': 'text/xml'
                url: 'http://www.s2way.com:10000/resource/'
                on: (event, callback) ->
                    if event is 'data'
                        return callback '<?xml version="1.0" encoding="UTF-8" ?><root>this is a payload</root>'
                    if event is 'end'
                        callback()
            )
            request.receive (payload) ->
                expect(payload.root).to.be 'this is a payload'

        it 'should call the callback passing the payload as a JSON if the Content-Type is application/json', ->
            request = new Request(
                method: 'GET'
                headers:
                    'content-type': 'application/json'
                url: 'http://www.s2way.com:10000/resource/'
                on: (event, callback) ->
                    if event is 'data'
                        return callback '{"this":"is","a":"payload"}'
                    if event is 'end'
                        callback()
            )
            request.receive (payload) ->
                expect(payload['this']).to.be 'is'
                expect(payload.a).to.be 'payload'
