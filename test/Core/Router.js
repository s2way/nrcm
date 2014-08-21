/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var Router = require('./../../src/Core/Router');

describe('Router.js', function () {

    var logger = {
        'info' : function () { return; },
        'debug' : function () { return; }
    };

    describe('isValid', function () {
        var router = new Router(logger, '/#prefix1/#prefix2/$application/$controller');

        it('should return true when the URL contains less parts then the number of prefixes', function () {
            assert.equal(false, router.isValid('/1'));
            assert.equal(false, router.isValid('/'));
        });

        it('should return true when the URL maps to the number of prefixes', function () {
            assert.equal(true, router.isValid('/p1/p2'));
            assert.equal(true, router.isValid('/p1/p2/'));
        });

        it('should return true when the URL maps to the number of prefixes + application', function () {
            assert.equal(true, router.isValid('/p1/p2/app'));
            assert.equal(true, router.isValid('/p1/p2/app/'));
        });

        it('should return true when the URL maps to the number of prefixes + application + controller', function () {
            assert.equal(true, router.isValid('/p1/p2/app/controller'));
            assert.equal(true, router.isValid('/p1/p2/app/controller/'));
        });

        it('should return true when the URL contains more parts then the number of parts specified in the format', function () {
            assert.equal(true, router.isValid('/1/2/3/4/5/6/7'));
        });

        it('should return false if the url does not start with /', function () {
            assert.equal(false, router.isValid('a/1/2/3/'));
        });

        it('cannot have an extension', function () {
            assert.equal(false, router.isValid('/1/2/3/4.json'));
        });

        it('must accept urls ending with /', function () {
            assert.equal(true, router.isValid('/p1/p2/app/controller'));
            assert.equal(true, router.isValid('/p1/p2/app/controller/'));
        });
    });

    describe('decompose', function () {
        var router = new Router(logger, '/#locale/#service/$application/$controller');
        it('should decompose the URL and return the parts', function () {
            var url = 'http://localhost:3232/locale/service/application/controller/action/subaction?x=1&y=2&z=3';
            var expected = {
                'type' : 'controller',
                'controller' : 'controller',
                'application' : 'application',
                'prefixes' : {
                    'locale' : 'locale',
                    'service' : 'service'
                },
                'query' : {
                    'x' : '1',
                    'y' : '2',
                    'z' : '3'
                },
                'segments' : [
                    'action',
                    'subaction'
                ]
            };
            assert.equal(JSON.stringify(expected), JSON.stringify(router.decompose(url)));
        });

        it('should return type as root if the url is the root of the server', function () {
            assert.equal('root', router.decompose('http://localhost:3232/locale/service/').type);
            assert.equal('root', router.decompose('http://localhost:3232/locale/service').type);
            assert.equal('root', router.decompose('http://localhost:3232/locale/').type);
            assert.equal('root', router.decompose('http://localhost:3232/').type);
            assert.equal('root', router.decompose('http://localhost:3232').type);
            assert.equal('root', router.decompose('http://localhost:3232?abc=x').type);
        });

        it('should return type as root if the url is the root of the server', function () {
            assert.equal('appRoot', router.decompose('http://localhost:3232/locale/service/app/').type);
            assert.equal('appRoot', router.decompose('http://localhost:3232/locale/service/app').type);
            assert.equal('appRoot', router.decompose('http://localhost:3232/locale/service/app?abc=x').type);
        });

    });
});
