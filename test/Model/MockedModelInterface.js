/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var util = require('util');
var MockedModelInterface = require('./../../src/Model/MockedModelInterface');
var DataSource = require('./../../src/Model/DataSource');

describe('MockedModelInterface', function () {

    var instance;

    beforeEach(function () {
        instance = new MockedModelInterface(null, null);
    });

    describe('find', function () {

        it('should call the callback', function (done) {
            instance.find(null, function () {
                done();
            });
        });

    });

    describe('removeById', function () {

        it('should call the callback', function (done) {
            instance.removeById(null, function () {
                done();
            });
        });

    });

    describe('findByKey', function () {

        it('should call the callback', function (done) {
            instance.findByKey(null, null, function () {
                done();
            });
        });

    });

    describe('findAll', function () {

        it('should call the callback', function (done) {
            instance.findAll(null, null, null, function () {
                done();
            });
        });

    });

    describe('findById', function () {

        it('should call the callback', function (done) {
            instance.findById(null, function () {
                done();
            });
        });

    });

    describe('save', function () {

        it('should call the callback', function (done) {
            instance.save(null, null, function () {
                done();
            });
        });

    });

});
