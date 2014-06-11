var assert = require('assert');
var Router = require('./../src/Router');

describe('Router.js', function(){
    describe('isValid', function() {
        var router = new Router('/#prefix1/#prefix2/$application/$controller');
        it ('should return false when the number of parts of the URL differ from the number of parts specified in the format', function(){
            assert.equal(false, router.isValid('/1/2/3/4/5'));
            assert.equal(false, router.isValid('/1/2/3'));
        });
        it('should return false if the url does not start with /', function(){
            assert.equal(false, router.isValid('a/1/2/3/'));
        });
        it('cannot have an extension', function(){
            assert.equal(false, router.isValid('/1/2/3/4.json'));
        });
    });

    describe('decompose', function(){
        var router = new Router('/#locale/#service/$application/$controller');
        var url = 'http://localhost:3232/locale/service/application/controller?x=1&y=2&z=3';
        it('should decompose the URL and return the parts', function(){
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
                }
            };
            assert.equal(JSON.stringify(expected), JSON.stringify(router.decompose(url)));
        });
    });
});