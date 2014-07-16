function MyController() {

}

MyController.prototype.post = function (callback) {
	callback(this.payload);
};

module.exports = MyController;