expect = require 'expect.js'
Router = require './../../src/Core/Router'

describe 'Router.js', ->
    logger =
        info: -> return
        debug: -> return

    describe 'isValid', ->
        router = new Router('/#prefix1/#prefix2/$application/$controller')
        it 'should return true when the URL contains less parts then the number of prefixes', ->
            expect(router.isValid('/1')).to.be false
            expect(router.isValid('/')).to.be false
            return

        it 'should return true when the URL maps to the number of prefixes', ->
            expect(router.isValid('/p1/p2')).to.be true
            expect(router.isValid('/p1/p2/')).to.be true
            return

        it 'should return true when the URL maps to the number of prefixes + application', ->
            expect(router.isValid('/p1/p2/app')).to.be true
            expect(router.isValid('/p1/p2/app/')).to.be true
            return

        it 'should return true when the URL maps to the number of prefixes + application + controller', ->
            expect(router.isValid('/p1/p2/app/controller')).to.be true
            expect(router.isValid('/p1/p2/app/controller/')).to.be true
            return

        it 'should return true when the URL contains more parts then the number of parts specified in the format', ->
            expect(router.isValid('/1/2/3/4/5/6/7')).to.be true
            return

        it 'should return false if the url does not start with /', ->
            expect(false, router.isValid('a/1/2/3/')).to.be false
            return

        it 'cannot have an extension', ->
            expect(router.isValid('/1/2/3/4.json')).to.be false
            return

        it 'must accept urls ending with /', ->
            expect(router.isValid('/p1/p2/app/controller')).to.be true
            expect(router.isValid('/p1/p2/app/controller/')).to.be true
            return

        return

    describe 'findController', ->
        controllers =
            Controller: -> return
            'Controller.SubController': -> return
            'Controller.SubController.UltraSubController': -> return

        router = new Router('/#locale/#service/$application/$controller')
        it 'should match Controller if the url is controller/action', ->
            decomposed = router.decompose('/locale/service/app/controller/sub_controller/ultra_sub_controller/action')
            controllerInfo = router.findController(controllers, decomposed)
            expect(controllerInfo.controller).to.be 'Controller.SubController.UltraSubController'
            expect(JSON.stringify(controllerInfo.segments)).to.be JSON.stringify(['action'])

    describe 'compose()', ->
        router = new Router('/#locale/#service/$application/$controller')
        it 'should compose the resource object into a string according to the format', ->
            expectedUrl = '/pt_BR/serv-ice/sample/sub/my_controller/seg/ments?a=123&b=false'
            result = router.compose(
                controller: 'Sub.MyController'
                application: 'sample'
                query:
                    a: '123',
                    b: false
                segments: ['seg', 'ments']
                prefixes:
                    locale: 'pt_BR'
                    service: 'serv-ice'
            )
            expect(result).to.eql expectedUrl

    describe 'decompose()', ->
        router = new Router('/#locale/#service/$application/$controller')
        it 'should decompose the URL and return the parts', ->
            url = 'http://localhost:3232/locale/service/application/controller/action/sub_action?x=1&y=2&z=3'
            expected =
                type: 'controller'
                controllers:
                    controller:
                        segments: [
                            'action'
                            'sub_action'
                        ]
                    'controller/action':
                        segments: ['sub_action']
                    'controller/action/sub_action':
                        segments: []
                application: 'application'
                prefixes:
                    locale: 'locale'
                    service: 'service'
                query:
                    x: '1'
                    y: '2'
                    z: '3'
                url: url
                host: 'localhost:3232'
                hostname: 'localhost'
                port: '3232'
                protocol: 'http:'

            decomposed = router.decompose(url)
            expect(decomposed).to.eql expected

        it 'should return type as root if the url is the root of the server', ->
            expect(router.decompose('http://localhost:3232/locale/service/').type).to.be 'root'
            expect(router.decompose('http://localhost:3232/locale/service').type).to.be 'root'
            expect(router.decompose('http://localhost:3232/locale/').type).to.be 'root'
            expect(router.decompose('http://localhost:3232/').type).to.be 'root'
            expect(router.decompose('http://localhost:3232').type).to.be 'root'
            expect(router.decompose('http://localhost:3232?abc=x').type).to.be 'root'

        it 'should return type as appRoot if the url is the root of the application', ->
            expect(router.decompose('http://localhost:3232/locale/service/app/').type).to.be 'appRoot'
            expect(router.decompose('http://localhost:3232/locale/service/app').type).to.be 'appRoot'
            expect(router.decompose('http://localhost:3232/locale/service/app?abc=x').type).to.be 'appRoot'
