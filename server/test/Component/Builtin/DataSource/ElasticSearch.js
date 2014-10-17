/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';

var ElasticSearch = require('./../../../../src/Component/Builtin/DataSource/ElasticSearch');
var expect = require('expect.js');

describe('ElasticSearch.js', function () {

    var instance;

    beforeEach(function () {
        instance = new ElasticSearch('default');
        instance.logger = {
            'info': function () {
                return;
            }
        };
        instance.core = {
            'dataSources': {
                'default': {
                    'host': 'localhost',
                    'port' : 9000
                }
            }
        };
    });

    describe('client', function () {
        it('should return the elasticsearch client', function () {
            expect(instance.client()).to.be.ok();
        });

        it('should throw an IllegalArgument exception if the DataSource config cannot be found', function () {
            instance._elasticsearch = {
                'Client' : function (parameters) {
                    expect(parameters.host).to.be('localhost:9000');
                }
            };
            expect(function () {
                instance.client('invalid');
            }).to.throwException(function (e) {
                expect(e.name).to.be('IllegalArgument');
            });
        });
    });

});