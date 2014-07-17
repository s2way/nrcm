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
        this._model = new CouchbaseInterface(dataSource, configurations);
    } else if (dataSource.type === 'Mock') {
        this._model = new MockedModelInterface(dataSource, configurations);
    } else {
        throw new exceptions.IllegalArgument('Invalid DataSource type: ' + dataSource.type);
    }
    // Methods that are going to be injected directly 
    this.methods = ['find', 'findByKey', 'findById', 'findAll', 'save', 'removeById'];
}

/**
 * Smart find - by Id or by View 
 * PENDING: Check if query has a key field
 * @method find
 * @param {string} query
 * @param {function} callback
 */
ModelInterface.prototype.find = function (query, callback) {
    return this._model.find(query, callback);
};

/**
* Get a document using one of the related keys that points to this document
*
* @method findByKey
* @param {string} keyValue Value that will be used with prefix to find the document
* @param {string} keyName Prefix of the key
* @param {function} callback
*/
ModelInterface.prototype.findByKey = function (keyValue, keyName, callback) {
    return this._model.findByKey(keyValue, keyName, callback);
};

/**
* Get a document using the id
*
* @method findById
* @param {string} id Id that will be used with uid to find the document
* @param {function} callback
*/
ModelInterface.prototype.findById = function (id, callback) {
    return this._model.findById(id, callback);
};

/**
 * Get documents using a view
 *
 * @method findAll
 * @param {string} viewName
 * @param {object} viewOptions
 * @param {object} queryOptions
 * @param {function} callback
 */
ModelInterface.prototype.findAll = function (viewName, viewOptions, queryOptions, callback) {
    return this._model.findAll(viewName, viewOptions, queryOptions, callback);
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
    return this._model.save(id, data, callback, prefix, options);
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
    return this._model.removeById(id, callback, options);
};

module.exports = ModelInterface;
