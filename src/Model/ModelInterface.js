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

ModelInterface.prototype.findByKey = function(keyValue, keyName, callback) {
	return this.model.findByKey(keyValue, keyName, callback);
};

ModelInterface.prototype.findById = function(id, callback) {
	return this.model.findById(id, callback);
};

ModelInterface.prototype.save = function(id, data, callback, prefix, options) {
	return this.model.save(id, data, callback, prefix, options);
};

ModelInterface.prototype.removeById = function(id, callback, options) {
	return this.model.removeById(id, callback, options);
};

module.exports = ModelInterface;
