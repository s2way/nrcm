/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';
var Https = require('./../../../src/Component/Builtin/Https');
var expect = require('expect.js');

describe('Https.js', function () {

    var instance;

    beforeEach(function () {
        var httpMock = {
            'get' : function () {
                return;
            }
        };

        instance = new Https();
        instance.component = function () {
            return httpMock;
        };
        instance.init();
    });

    describe('init', function () {
        it('should inject the get method', function (done) {
            instance = new Https();
            instance.component = function () {
                return {
                    'get' : function () {
                        done();
                    }
                };
            };
            instance.init();
            instance.get();
        });
    });

    describe('requestLibrary', function () {

        it('should set the http node library as a property', function (done) {
            var https = require('https');
            expect(instance._http._protocol).to.be.eql(https);
            done();
        });
    });

});