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

    describe('copy', function () {

        it('should perform a deep copy of a json object removing unserializable properties', function () {
            var toCopy, copy;
            toCopy = {
                'a' : [1, 'one'],
                'b' : ['two', 2],
                'c' : function () {
                    return 'three';
                }
            };
            copy = instance.copy(toCopy);
            expect(copy.a).to.be.an('array');
            expect(copy.b[0]).to.be('two');
            expect(copy.c).not.to.be.ok();
            expect(copy.a !== toCopy.a).to.be(true);
            expect(copy.b !== toCopy.b).to.be(true);
        });
    });

});