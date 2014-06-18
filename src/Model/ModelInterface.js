/*jslint devel: true, node: true, indent: 4 */
'use strict';
/*
 * Dependencies
 */
var CouchbaseInterface = require('./CouchbaseInterface');
var MockedModelInterface = require('./MockedModelInterface');

var exceptions = require('./../exceptions');

function ModelInterface(dataSource, configurations) {
    this.dataSource = dataSource;
    if (dataSource.type === 'Couchbase') {
        this.model = new CouchbaseInterface(dataSource, configurations);
    } else if (dataSource.type === 'Mock') {
        this.model = new MockedModelInterface(dataSource, configurations);
    } else {
        throw new exceptions.IllegalArgument('Invalid DataSource type: ' + dataSource.type);
    }
}
/**
* Get a document using one of the related keys that points to this document
*
* @method findByKey
* @param {string} keyValue Value that will be used with prefix to find the document
* @param {string} keyName Prefix of the key
* @param {function} callback
*/
ModelInterface.prototype.findByKey = function (keyValue, keyName, callback) {
    return this.model.findByKey(keyValue, keyName, callback);
};
/**
* Get a document using the id
*
* @method findById
* @param {string} id Id that will be used with uid to find the document
* @param {function} callback
*/
ModelInterface.prototype.findById = function (id, callback) {
    return this.model.findById(id, callback);
};
/**
* Index a document in the database
*
* @method save
* @param {string} id Id that will be used with uid/prefix to index the document
* @param {json} data Document data to index
* @param {function} callback
* @param {string} prefix If using a related document
* @param {json} data Options to report to the database behavior
*/
ModelInterface.prototype.save = function (id, data, callback, prefix, options) {
    return this.model.save(id, data, callback, prefix, options);
};
/**
* Delete a document
*
* @method removeById
* @param {string} id Id that will be used with uid/prefix to delete the document
* @param {function} callback
* @param {json} data Options to report to the database behavior
*/
ModelInterface.prototype.removeById = function (id, callback, options) {
    return this.model.removeById(id, callback, options);
};

module.exports = ModelInterface;
