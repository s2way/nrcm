/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */

'use strict';

var SystemInfo = require('./../../../src/Component/Builtin/SystemInfo');
var assert = require('assert');

describe('SystemInfo.js', function () {
    describe('refresh', function () {
        it('should return an updated data', function () {
            var si = new SystemInfo();
            assert(si.refresh());
        });
    });
});