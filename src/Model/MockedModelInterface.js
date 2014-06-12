function MockedModelInterface(dataSource, configurations) {
}

MockedModelInterface.prototype.removeById = function(id, callback, options) {
	callback();
};

MockedModelInterface.prototype.findByKey = function(keyValue, keyName, callback) {
	callback();
};

MockedModelInterface.prototype.findById = function(id, callback) {
	callback();
};

MockedModelInterface.prototype.save = function(id, data, callback, prefix, options) {
	callback();
};

module.exports = MockedModelInterface;
