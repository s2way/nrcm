Http = require './../../../src/Component/Builtin/Http'
expect = require 'expect.js'

describe 'Http.js', ->

    mockHttp = (options) ->
        callCallback = (callback) ->
            setImmediate callback

        onData = (callback) ->
            setImmediate ->
                callback ''

        onRequestMethod = (event, callback) ->
            if event is 'error'
                options.request.onError callback
            else if event is 'data'
                options.request.onData callback
            else options.request.onEnd callback  if event is 'end'

        onResponseMethod = (event, callback) ->
            if event is 'error'
                options.response.onError callback
            else if event is 'data'
                options.response.onData callback
            else options.response.onEnd callback  if event is 'end'

        requestFunction = (requestOptions, requestCallback) ->
            setImmediate ->
                requestCallback
                    on: onResponseMethod
                    statusCode: options.response.statusCode
                    headers: options.response.headers

            setHeader: options.request.setHeader
            on: onRequestMethod
            end: blankFunction
            write: blankFunction

        options = options or {}
        options.response = options.response or {}
        options.response.statusCode = options.response.statusCode or 200
        options.response.headers = options.response.headers or {}
        options.response.onError = options.response.onError or blankFunction
        options.response.onData = options.response.onData or onData
        options.response.onEnd = options.response.onEnd or callCallback
        options.request = options.request or {}
        options.request.onError = options.request.onError or blankFunction
        options.request.onData = options.request.onData or onData
        options.request.onEnd = options.request.onEnd or callCallback
        options.request.setHeader = options.request.setHeader or blankFunction
        options.requestFunction = options.requestFunction or requestFunction
        request: options.requestFunction

    instance = null
    blankFunction = ->
        return

    beforeEach ->
        instance = new Http()
        instance._protocol = mockHttp()
        return

    describe 'request options', ->
        arbitraryRequestOptions = undefined
        expectedRequestOptions = undefined
        arbitraryRequestOptions =
            secureProtocol: 'SSLv3_method'
            agent: false
            anotherOption: 'optionValue'
            query: '?key=value'
            headers: 'some_header'

        expectedRequestOptions =
            secureProtocol: 'SSLv3_method'
            agent: false
            anotherOption: 'optionValue'
            query: '?key=value'
            headers: 'some_header'
            resource: '/'

        it 'should allow user to set arbitrary request options on get', (done) ->
            instance.request = (options, callback) ->
                callback options

            expectedRequestOptions.method = 'get'
            instance.get '/', arbitraryRequestOptions, (response) ->
                expect(response).to.be.eql expectedRequestOptions
                done()

        it 'should allow user to set arbitrary request options on delete', (done) ->
            instance.request = (options, callback) ->
                callback options

            expectedRequestOptions.method = 'delete'
            instance['delete'] '/', arbitraryRequestOptions, (response) ->
                expect(response).to.be.eql expectedRequestOptions
                done()

        it 'should allow user to set arbitrary request options on put', (done) ->
            instance.request = (options, callback) ->
                callback options

            expectedRequestOptions.method = 'put'
            instance.put '/', arbitraryRequestOptions, (response) ->
                expect(response).to.be.eql expectedRequestOptions
                done()

        it 'should allow user to set arbitrary request options on post', (done) ->
            instance.request = (options, callback) ->
                callback options

            expectedRequestOptions.method = 'post'
            instance.post '/', arbitraryRequestOptions, (response) ->
                expect(response).to.be.eql expectedRequestOptions
                done()

    describe 'get', ->
        it 'should perform a get operation', (done) ->
            instance.get '/', {}, (error, response) ->
                expect(response).to.be.ok()
                done()

    describe 'delete', ->
        it 'should perform a delete operation', (done) ->
            instance['delete'] '/', {}, (error, response) ->
                expect(response).to.be.ok()
                done()

    describe 'post', ->
        it 'should perform a post operation', (done) ->
            instance.post '/', {}, (error, response) ->
                expect(response).to.be.ok()
                done()

        it 'should convert the JSON payload to an url-encoded if the content type is x-www-form-urlencoded', (done) ->
            instance = new Http(contentType: 'application/x-www-form-urlencoded')
            instance._protocol = mockHttp(requestFunction: ->
                setHeader: blankFunction
                end: blankFunction
                on: blankFunction
                write: (payload) ->
                    expect(payload).to.be 'this%20is%20a%20bad%20key=this%20is%20a%20bad%20value'
                    done()
            )
            instance.post '/',
                payload:
                    'this is a bad key': 'this is a bad value'
            , blankFunction

        it 'should convert the JSON payload to a XML if the content type is text/xml', (done) ->
            instance = new Http(contentType: 'text/xml')
            instance._protocol = mockHttp(requestFunction: ->
                setHeader: blankFunction
                end: blankFunction
                on: blankFunction
                write: (payload) ->
                    expect(payload).to.be '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<root>?</root>'
                    done()
            )
            instance.post '/',
                payload:
                    root: '?'
            , blankFunction

        it 'should convert the payload to null if it is an empty string', (done) ->
            instance = new Http(contentType: 'application/json')
            instance._protocol = mockHttp(response:
                onData: (callback) -> callback ''
                headers: 'content-type': 'application/json'
            )
            instance.post '/', {}, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response.body).to.be null
                done()


        it 'should convert the url encoded response to a JSON if the response content type is x-www-form-urlencoded', (done) ->
            instance = new Http(contentType: 'application/json') # Body is JSON, response is x-www-form-urlencoded
            instance._protocol = mockHttp(response:
                onData: (callback) ->
                    callback 'this%20is%20a%20bad%20key=this%20is%20a%20bad%20value'

                headers:
                    'content-type': 'application/x-www-form-urlencoded'
            )
            instance.post '/', {}, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response.body['this is a bad key']).to.be 'this is a bad value'
                done()

        it 'should convert the XML response to a JSON if the response content type is text/xml', (done) ->
            instance = new Http(contentType: 'application/json') # Body is JSON, response is text/xml
            instance._protocol = mockHttp(response:
                onData: (callback) ->
                    callback '<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?><root></root>'
                    return

                headers:
                    'content-type': 'text/xml'
            )
            instance.post '/', {}, (error, response) ->
                expect(error).not.to.be.ok()
                expect(response.body.root).to.be ''
                done()

        it 'should issue another post with the exact same data if the server response was 3xx', (done) ->
            instance = new Http()
            instance._protocol = mockHttp(response:
                onData: (callback) ->
                    callback '{}'

                headers:
                    'content-type': 'application/json'
                    location: 'www.google.com'

                statusCode: 302
            )
            instance._redirect = (location, options, callback, redirectCounter) ->
                expect(location).to.be 'www.google.com'
                expect(options).to.be.ok()
                expect(callback).to.be.ok()
                expect(redirectCounter).to.be 0
                done()

            instance.post '/', {}, ->

        it 'should call the callback passing an error if too many redirects occur', (done) ->
            instance = new Http()
            instance._protocol = mockHttp(response:
                onData: (callback) ->
                    callback '{}'

                headers:
                    'content-type': 'application/json'
                    location: 'www.google.com'

                statusCode: 302
            )
            instance.post '/', {}, (error) ->
                expect(error.name).to.be 'TooManyRedirects'
                done()

    describe 'put', ->
        it 'should perform a put operation', (done) ->
            instance.put '/', {}, (error, response) ->
                expect(response).to.be.ok()
                done()

    describe 'setHeaders', ->
        it 'should set the headers', ->
            headers = undefined
            headers = 'X-Something': 'X-Value'
            instance.setHeaders headers
            expect(instance._headers).to.be headers

    describe 'request', ->
        it 'should return a response object containing the status code', (done) ->
            instance.request
                method: 'get'
                resource: '/'
            , (error, response) ->
                expect(error).not.to.be.ok()
                expect(response.statusCode).to.be 200
                done()

        it 'should return a response object containing the response headers', (done) ->
            instance.request
                method: 'get'
                resource: '/'
            , (error, response) ->
                expect(response.headers).to.be.ok()
                done()

        it 'should call the callback passing the error object if something wrong occurs', (done) ->
            errorObject = {}
            instance._protocol = mockHttp(
                response:
                    onEnd: blankFunction

                request:
                    onData: blankFunction
                    onEnd: blankFunction
                    onError: (callback) ->
                        callback errorObject
            )
            instance.request
                method: 'get'
                resource: '/'
            , (error, response) ->
                expect(error).to.be errorObject
                expect(response).not.to.be.ok()
                done()

        it 'should return a response object containing the response body', (done) ->
            instance._protocol = mockHttp(response:
                onData: (callback) ->
                    callback '{}'
            )
            instance.request
                method: 'get'
                resource: '/'
            , (error, response) ->
                expect(JSON.stringify(response.body)).to.be '{}'
                done()
