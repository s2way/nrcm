var exceptions = require('./../exceptions');

function ModelTrigger(before, operation, after, callback) {
	if (typeof before !== 'function') {
		before = function(params, callback){
			callback(true);
		};
	}
	if (typeof after !== 'function') {
		after = function(params, callback) {
			callback();
		};
	}
	if (typeof operation !== 'function') {
		operation = function(err) {
			callback(err);
		};
	}
	this.before = before;
	this.operation = operation;
	this.after = after;
	this.callback = callback;
}

ModelTrigger.prototype.execute = function(params) {
	var that = this;

	this.before(params, function(continueOperation){
		if (continueOperation === undefined || !continueOperation) {
			that.callback(new exceptions.OperationInterrupted());
		} else {
			that.operation(function(err){
				if (err) {
					that.callback(err);
				} else {
					that.after(params, that.callback);
				}
			});
		}
	});
}


module.exports = ModelTrigger;