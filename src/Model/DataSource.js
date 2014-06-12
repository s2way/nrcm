var exceptions = require('./../exceptions');

function DataSource(configs) {
	if (typeof configs !== 'object' ||
		typeof configs.host !== 'string' ||
		typeof configs.port !== 'string' || 
		typeof configs.type !== 'string' ||
		typeof configs.index !== 'string') {
		throw new exceptions.IllegalArgument();
	}

	this.host = configs.host;
	this.port = configs.port;
	this.type = configs.type;
	this.index = configs.index;
	this.connection = null;
	this.couchbase = require('couchbase');
}

DataSource.prototype.connect = function(onSuccess, onError) {
	var that = this;
	if (typeof onSuccess !== 'function' ||
		typeof onError !== 'function') {
		throw new exceptions.IllegalArgument();
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

DataSource.prototype.disconnect = function(onSuccess, onError) {
	if (typeof onSuccess !== 'function' ||
		typeof onError !== 'function') {
		throw new exceptions.IllegalArgument();
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
