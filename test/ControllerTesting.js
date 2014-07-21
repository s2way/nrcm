/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var ControllerTesting = require('../src/ControllerTesting');

describe('ControllerTesting', function () {

    var ct;
    var payload = {
        'this' : 'is',
        'a' : 'payload'
    };
    var query = {
        'this' : 'is',
        'a' : 'query string'
    };

    function MyController() {
        this.post = function (callback) {
            callback({
                'payload' : this.payload,
                'query' : this.query
            });
        };
        return;
    }

    beforeEach(function () {
        ct = new ControllerTesting('./');
        ct._require = function () {
            return MyController;
        };
    });

    describe('call', function () {

        it('should call the controller method', function (done) {

            ct.call('MyController', 'post', {
                'payload' : payload,
                'query' : query
            }, function (response) {
                assert.equal(JSON.stringify(payload), JSON.stringify(response.payload));
                assert.equal(JSON.stringify(query), JSON.stringify(response.query));
                done();
            });

        });

        it('should access the payload as an empty string if it is not passed', function () {
            ct.call('MyController', 'post', { }, function (response) {
                assert.equal(JSON.stringify({}), JSON.stringify(response.payload));
            });
        });
    });

});