function MockModel(dataSource, configurations) {
}

MockModel.prototype.removeById = function(id, callback, options) {
	callback();
};

MockModel.prototype.findByKey = function(keyValue, keyName, callback) {
	callback();
};

MockModel.prototype.findById = function(id, callback) {
	callback();
};

MockModel.prototype.save = function(id, data, callback, prefix, options) {
	callback();
};

module.exports = MockModel;
