expect = require 'expect.js'
Request = require './../../src/Controller/Request'

describe 'Request', ->

    logger = null

    beforeEach ->
        logger =
            log: -> return

    describe 'isApplicationRoot()', ->

        it 'should return true if the the request.type is appRoot', ->
            request = new Request method: 'GET', logger
            request.type = 'appRoot'
            expect(request.isApplicationRoot()).to.be true

    describe 'isServerRoot()', ->

        it 'should return true if the the request.type is appRoot', ->
            request = new Request method: 'GET', logger
            request.type = 'root'
            expect(request.isServerRoot()).to.be true

    describe 'isController()', ->

        it 'should return true if the the request.type is appRoot', ->
            request = new Request method: 'GET', logger
            request.type = 'controller'
            expect(request.isController()).to.be true

    describe 'receive()', ->

        it 'should call the callback passing the string if the Content-Type is text/plain', ->
            request = new Request(
                method: 'GET'
                headers:
                    'content-type': 'text/plain'
                url: 'http://www.s2way.com:10000/resource/'
                on: (event, callback) ->
                    if event is 'data'
                        return callback 'textual payload'
                    if event is 'end'
                        callback()
                , logger
            )
            request.receive (payload) ->
                expect(payload).to.be 'textual payload'

        it 'should call the callback passing a null payload if the payload is an empty string', ->
            request = new Request(
                method: 'GET'
                headers:
                    'content-type': 'application/json'
                url: 'http://www.s2way.com:10000/resource/'
                on: (event, callback) ->
                    if event is 'data'
                        return callback ''
                    if event is 'end'
                        callback()
                , logger
            )
            request.receive (payload) ->
                expect(payload).to.be null

        it 'should call the callback passing a null payload if the Content-Type is application/json and the JSON is invalid', ->
            request = new Request(
                method: 'GET'
                headers:
                    'content-type': 'application/json'
                url: 'http://www.s2way.com:10000/resource/'
                on: (event, callback) ->
                    if event is 'data'
                        return callback '{this is an invalid json}'
                    if event is 'end'
                        callback()
                , logger
            )
            request.receive (payload) ->
                expect(payload).to.be null

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
                , logger
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
                , logger
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
                , logger
            )
            request.receive (payload) ->
                expect(payload['this']).to.be 'is'
                expect(payload.a).to.be 'payload'
