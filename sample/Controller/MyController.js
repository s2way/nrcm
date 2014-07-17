function MyController() {

}

MyController.prototype.before = function (callback) {
	callback(true);
};

MyController.prototype.after = function (callback) {
	callback();
};

MyController.prototype.post = function (callback) {
	callback(this.payload);
};

MyController.prototype.put = function (callback) {
	var myComponent = this.component('MyComponent');
	callback(myComponent.method());
};

MyController.prototype.get = function (callback) {
	var myModel = this.model('MyModel');
	myModel.find(callback);
};

module.exports = MyController;