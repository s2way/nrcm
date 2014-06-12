/*
 * Dependencies
 */
var CouchbaseModel = require('./CouchbaseModel');
var MockModel = require('./MockModel');

var exceptions = require('./../exceptions');

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

Model.prototype.findByKey = function(keyValue, keyName, callback) {
	return this.model.findByKey(keyValue, keyName, callback);
};

Model.prototype.findById = function(id, callback) {
	return this.model.findById(id, callback);
};

Model.prototype.save = function(id, data, callback, prefix, options) {
	return this.model.save(id, data, callback, prefix, options);
};

Model.prototype.removeById = function(id, callback, options) {
	return this.model.removeById(id, callback, options);
};

module.exports = Model;
