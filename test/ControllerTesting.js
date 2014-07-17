/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var assert = require('assert');
var ControllerTesting = require('../src/ControllerTesting');

describe('ControllerTesting', function () {

    var ct;

    function MyController() {
        this.post = function (callback) {
            callback({});
        };
        return;
    }

    beforeEach(function () {
        ct = new ControllerTesting();
        ct._require = function () {
            return MyController;
        };
    });

    describe('load', function () {

        it('should load the controller into the application object', function () {

            ct.load('MyController');
            assert.equal('function', typeof ct.applications.app.controllers.MyController);

        });

    });

    // describe('call', function () {
    // });

});