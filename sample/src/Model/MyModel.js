function MyModel() {
    this.uid = 'my_model';
}

MyModel.prototype.find = function (callback) {
    var myComponent = this.component('MyComponent');
    callback(myComponent.method());
};

MyModel.prototype.test = function (callback) {
    callback({
        '_find' : typeof this._find
    })
}

MyModel.prototype.findAll = function (callback) {
    callback([{
        'some' : 'json'
    }, {
        'another' : 'json'
    }]);
};

module.exports = MyModel;