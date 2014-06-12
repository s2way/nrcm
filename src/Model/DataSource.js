var exceptions = require('./../exceptions');

/**
 * DataSource object, the datasource is persistent and last the whole request
 *
 * @constructor
 * @method DataSource
 * @param {json} configs The json with the database parameters
 */
function DataSource(configs) {
	if (typeof configs !== 'object' ||
		typeof configs.host !== 'string' ||
		typeof configs.port !== 'string' ||
		typeof configs.type !== 'string' ||
		typeof configs.index !== 'string') {
		throw new exceptions.IllegalArgument('Invalid DataSource configurations');
	}

	this.host = configs.host;
	this.port = configs.port;
	this.type = configs.type;
	this.index = configs.index;
	this.connection = null;
	this.couchbase = require('couchbase');
}

/**
 * Establish a connection with the database
 *
 * @method connect
 * @param {function} onSuccess Callback for the success
 * @param {function} onError Callback for the error
 */
DataSource.prototype.connect = function(onSuccess, onError) {
	var that = this;
	if (typeof onSuccess !== 'function' ||
		typeof onError !== 'function') {
		throw new exceptions.IllegalArgument('DataSource.connect() onSuccess and onError must be functions');
	}
	if (this.connection !== null) {
		onSuccess(this.connection);
		return;
	}

	if (this.type === 'Couchbase') {
		var connection = new this.couchbase.Connection({
			'host' : this.host + ':' + this.port,
			'bucket' : this.index
		}, function(error){
			that.connection = connection;
			if (error) {
				onError(error);
			} else {
				onSuccess(connection);
			}
		});
	} else {
		onError();
	}
};

/**
 * Disconnect from the database
 *
 * @method disconnect
 * @param {function} onSuccess Callback for the success
 * @param {function} onError Callback for the error
 */
DataSource.prototype.disconnect = function(onSuccess, onError) {
	if (typeof onSuccess !== 'function' ||
		typeof onError !== 'function') {
		throw new exceptions.IllegalArgument('DataSource.disconnect() onSuccess and onError must be functions');
	}
	if (this.connection !== null) {
		if (this.type === 'Couchbase') {
			this.connection.shutdown();
			onSuccess();
			this.connection = null;
		} else {
			onError();
		}
	} else {
		onError();
	}
};

module.exports = DataSource;
