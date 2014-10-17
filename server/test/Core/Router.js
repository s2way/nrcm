/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var expect = require('expect.js');
var Router = require('./../../src/Core/Router');

describe('Router.js', function () {

    var logger = {
        'info' : function () { return; },
        'debug' : function () { return; }
    };

    describe('isValid', function () {
        var router = new Router(logger, '/#prefix1/#prefix2/$application/$controller');

        it('should return true when the URL contains less parts then the number of prefixes', function () {
            expect(router.isValid('/1')).to.be(false);
            expect(router.isValid('/')).to.be(false);
        });

        it('should return true when the URL maps to the number of prefixes', function () {
            expect(router.isValid('/p1/p2')).to.be(true);
            expect(router.isValid('/p1/p2/')).to.be(true);
        });

        it('should return true when the URL maps to the number of prefixes + application', function () {
            expect(router.isValid('/p1/p2/app')).to.be(true);
            expect(router.isValid('/p1/p2/app/')).to.be(true);
        });

        it('should return true when the URL maps to the number of prefixes + application + controller', function () {
            expect(router.isValid('/p1/p2/app/controller')).to.be(true);
            expect(router.isValid('/p1/p2/app/controller/')).to.be(true);
        });

        it('should return true when the URL contains more parts then the number of parts specified in the format', function () {
            expect(router.isValid('/1/2/3/4/5/6/7')).to.be(true);
        });

        it('should return false if the url does not start with /', function () {
            expect(false, router.isValid('a/1/2/3/')).to.be(false);
        });

        it('cannot have an extension', function () {
            expect(router.isValid('/1/2/3/4.json')).to.be(false);
        });

        it('must accept urls ending with /', function () {
            expect(router.isValid('/p1/p2/app/controller')).to.be(true);
            expect(router.isValid('/p1/p2/app/controller/')).to.be(true);
        });
    });

    describe('findController', function () {
        var controllers = {
            'Controller' : function () { return; },
            'Controller.SubController' : function () { return; },
            'Controller.SubController.UltraSubController' : function () { return; }
        };
        var router = new Router(logger, '/#locale/#service/$application/$controller');
        it('should match Controller if the url is controller/action', function () {
            var decomposed = router.decompose('/locale/service/app/controller/sub_controller/ultra_sub_controller/action');
            var controllerInfo = router.findController(controllers, decomposed);
            expect(controllerInfo.controller).to.be('Controller.SubController.UltraSubController');
            expect(JSON.stringify(controllerInfo.segments)).to.be(JSON.stringify(['action']));
        });
    });

    describe('decompose', function () {
        var router = new Router(logger, '/#locale/#service/$application/$controller');
        it('should decompose the URL and return the parts', function () {
            var url = 'http://localhost:3232/locale/service/application/controller/action/sub_action?x=1&y=2&z=3';
            var expected = {
                'type': 'controller',
                'controllers': {
                    'controller': {
                        'segments' : [
                            'action',
                            'sub_action'
                        ]
                    },
                    'controller/action': {
                        'segments' : [
                            'sub_action'
                        ]
                    },
                    'controller/action/sub_action': {
                        'segments' : []
                    }
                },
                'application' : 'application',
                'prefixes' : {
                    'locale' : 'locale',
                    'service' : 'service'
                },
                'query' : {
                    'x' : '1',
                    'y' : '2',
                    'z' : '3'
                }
            };
            var decomposed = router.decompose(url);
            expect(JSON.stringify(decomposed)).to.be(JSON.stringify(expected));
        });

        it('should return type as root if the url is the root of the server', function () {
            expect(router.decompose('http://localhost:3232/locale/service/').type).to.be('root');
            expect(router.decompose('http://localhost:3232/locale/service').type).to.be('root');
            expect(router.decompose('http://localhost:3232/locale/').type).to.be('root');
            expect(router.decompose('http://localhost:3232/').type).to.be('root');
            expect(router.decompose('http://localhost:3232').type).to.be('root');
            expect(router.decompose('http://localhost:3232?abc=x').type).to.be('root');
        });

        it('should return type as root if the url is the root of the server', function () {
            expect(router.decompose('http://localhost:3232/locale/service/app/').type).to.be('appRoot');
            expect(router.decompose('http://localhost:3232/locale/service/app').type).to.be('appRoot');
            expect(router.decompose('http://localhost:3232/locale/service/app?abc=x').type).to.be('appRoot');
        });

    });
});
