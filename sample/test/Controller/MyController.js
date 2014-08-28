var assert = require('assert');
var path = require('path');
var Testing = require('../../../src/WaferPie').Testing;

describe('MyController', function () {

    var testing = new Testing(path.join(__dirname, '../../../sample'));

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
            testing.mockModel('Ticket', {
                'find' : function () {

                }
            });
            testing.callController('MyController', 'post', options, function (response) {
                assert.equal(JSON.stringify(options.payload), JSON.stringify(response.payload));
                assert.equal(JSON.stringify(options.query), JSON.stringify(response.query));
                done();
            });
        });

    });

});

