/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it */
'use strict';

var expect = require('expect.js');
var XML = require('./../../../src/Component/Builtin/XML');

describe('XML.js', function () {

    var instance, json, xml;

    instance = new XML();
    json = {
        'root' : {
            'child' : [{
                '#' : 'Some text.',
                '@' : {
                    'attribute' : 'value'
                }
            }]
        }
    };
    xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<root>\n  <child attribute="value">Some text.</child>\n</root>';

    describe('fromJSON', function () {
        it('should convert the JSON to a XML', function (done) {
            expect(instance.fromJSON(json)).to.be(xml);
            done();
        });
    });

    describe('toJSON', function () {
        it('should convert the XML to a JSON', function (done) {
            expect(JSON.stringify(instance.toJSON(xml))).to.be(JSON.stringify(json));
            done();
        });
    });

});