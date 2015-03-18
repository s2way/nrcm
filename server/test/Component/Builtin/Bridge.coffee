Bridge = require './../../../src/Component/Builtin/Bridge'
expect = require 'expect.js'

describe 'Bridge.js', ->

    instance = null
    blankFunction = ->

    beforeEach ->
        instance = new Bridge('wallet')
        instance.core = bridges:
            wallet:
                app: 'wallet'
                host: 'localhost'
                port: '8001'
                urlFormat : '#token/$application/$controller'

    describe 'init', ->
        it 'should throw an IllegalArgument exception if the bridge cannot be found', ->
            expect(->
                instance = new Bridge 'invalid'
                instance.core = bridges: {}
                instance.init()
            ).to.throwException (e) ->
                expect(e.name).to.be 'IllegalArgument'

    describe 'put, get, delete, post', ->
        methods = ['put', 'get', 'delete', 'post']
        methods.forEach (method) ->
            it "should call Http.#{method}() method passing the correct parameters", (done) ->
                payment = {}
                query = param: 1, another: 'string'
                headers = {}
                segments = ['one', 'two', 'three']
                prefixes = token : 'token1'
                instance.component = ->
                    object = {}
                    object[method] = (resource, options, callback) ->
                        expect(resource).to.be 'token1/wallet/sub/payment/one/two/three?param=1&another=string'
                        expect(options.payload).to.be payment
                        expect(options.headers).to.be headers
                        expect(callback).to.be.a 'function'
                        done()
                        return

                    object

                instance.init()
                instance[method] 'Sub.Payment',
                    payload: payment
                    headers: headers
                    query: query
                    segments: segments
                    prefixes : prefixes
                , blankFunction