var assert = require('assert');
var path = require('path');
var ControllerTesting = require('../../../src/NRCM').ControllerTesting;

describe('MyController', function () {

    var testing = new ControllerTesting(path.join(__dirname, '../../../sample'));

    describe('post', function () {

        it('should pass the payload to the callback', function (done) {
            var options = {
                'payload' : {
                    'a' : 'json',
                    'payload' : true
                },
                'query' : {
                    'this' : 'is',
                    'a' : 'possible',
                    'query' : 'string'
                }
            };
            testing.call('MyController', 'post', options, function (response) {
                assert.equal(JSON.stringify(options.payload), JSON.stringify(response.payload));
                assert.equal(JSON.stringify(options.query), JSON.stringify(response.query));
                done();
            });
        });


    });

});

