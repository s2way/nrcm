function MyController() {

}

MyController.prototype.before = function (callback) {
	callback(true);
};

MyController.prototype.after = function (callback) {
	callback();
};

MyController.prototype.post = function (callback) {
	callback({
        'payload' : this.payload,
        'query' : this.query,
        'segments' : this.segments
    });
};

MyController.prototype.

MyController.prototype.delete = function (callback) {
    this.model('MyModel').test(callback);
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