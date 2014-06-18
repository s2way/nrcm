/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var utils = require('./../../src/Model/utils');

describe('utils.js', function () {
    describe('merge', function () {
        it('should merge two different objects into one', function () {
            var to = {
                '3' : {
                    '3.5' : 3.5
                },
                '6' : 6,
                '7' : 7
            };
            var from = {
                '1' : 1,
                '2' : 2,
                '3' : {
                    '4' : 4,
                    '5' : 5
                }
            };
            var expectedResult = {
                '1' : 1,
                '2' : 2,
                '3' : {
                    '3.5' : 3.5,
                    '4' : 4,
                    '5' : 5
                },
                '6' : 6,
                '7' : 7
            };
            assert.equal(JSON.stringify(expectedResult), JSON.stringify(utils.merge(from, to)));
            assert.equal(JSON.stringify(expectedResult), JSON.stringify(utils.merge(to, from)));
        });
    });
});