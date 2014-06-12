var CouchbaseModel = require('./CouchbaseModel');
var MockModel = require('./MockModel');
var exceptions = require('./../exceptions');

/**
 * The Model object
 *
 * @constructor
 * @method Model
 * @param {object} dataSource The datasource
 * @param {json} configurations The configurations
 */
function Model(dataSource, configurations) {
	this.dataSource = dataSource;
	if (dataSource.type === 'Couchbase') {
		this.model = new CouchbaseModel(dataSource, configurations);
	} else if (dataSource.type === 'Mock') {
		this.model = new MockModel(dataSource, configurations);
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
Model.prototype.findByKey = function(keyValue, keyName, callback) {
	return this.model.findByKey(keyValue, keyName, callback);
};

/**
 * Get a document using the id
 *
 * @method findById
 * @param {string} id Id that will be used with uid to find the document
 * @param {function} callback
 */
Model.prototype.findById = function(id, callback) {
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
Model.prototype.save = function(id, data, callback, prefix, options) {
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
Model.prototype.removeById = function(id, callback, options) {
	return this.model.removeById(id, callback, options);
};

module.exports = Model;
