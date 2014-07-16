function MyModel() {

}

MyModel.prototype.find = function (callback) {
	var myComponent = this.component('MyComponent');
	callback(myComponent.method());
};

MyModel.prototype.findAll = function (callback) {
	callback([{
		'some' : 'json'
	}, {
		'another' : 'json'
	}]);
};

module.exports = MyModel;