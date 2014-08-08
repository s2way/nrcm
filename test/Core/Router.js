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

        it('should return false when the URL contains less parts then the number of parts specified in the format', function () {
            assert.equal(false, router.isValid('/1/2/3'));
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
        var url = 'http://localhost:3232/locale/service/application/controller/action/subaction?x=1&y=2&z=3';
        it('should decompose the URL and return the parts', function () {
            var expected = {
                'controller' : 'controller',
                'application' : 'application',
                'prefixes' : {
                    'locale' : 'locale',
                    'service' : 'service',
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
    });
});