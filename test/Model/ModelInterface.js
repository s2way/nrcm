/*jslint devel: true, node: true, indent: 4 */
/*globals describe, it */
'use strict';
var assert = require('assert');
var ModelInterface = require('./../../src/Model/ModelInterface');

describe('ModelInterface.js', function () {

    var configurations = {
        'uid' : 'pessoa'
    };
    var dataSource = {
        'bucket' : 'bucket',
        'type' : 'Couchbase'
    };

    describe('ModelInterface', function () {

        it('shoud instantiate the DataSource object', function () {
            var model = new ModelInterface(dataSource, configurations);
            assert.equal(true, model.model !== null);
        });

        it('shoud instantiate the DataSource object when a Couchbase data source type is passed', function () {
            var model = new ModelInterface({
                'bucket' : 'bucket',
                'type' : 'Couchbase'
            }, configurations);
            assert.equal(true, model.model !== null);
        });

        it('should throw an IllegalArgument exception if the DataSource cannot be found', function () {
            try {
                var mi = new ModelInterface('Invalid', configurations);
                assert.equal(true, mi !== undefined);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
    });
});