/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it, beforeEach */
'use strict';

var Cherries = require('./../../src/Util/Cherries');
var path = require('path');
var expect = require('expect.js');

describe('Cherries.js', function () {

    var instance;

    beforeEach(function () {
        instance = new Cherries();
    });

    describe('elementNameToPath', function () {

        it('should return the right path for a given model name', function () {
            expect(instance.elementNameToPath('Folder.SubFolder.MyModel')).to.be(path.join('Folder', 'SubFolder', 'MyModel'));
            expect(instance.elementNameToPath('MyModel')).to.be(path.join('MyModel'));
        });
    });


});