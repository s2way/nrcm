'use strict';
function MyModel() {
    this.uid = 'my_model';
}

MyModel.prototype.find = function (callback) {
    var myComponent = this.component('MyComponent');
    myComponent.method(callback);
};

MyModel.prototype.test = function (callback) {
    callback({
        '$find' : typeof this.$find
    });
};

MyModel.prototype.findAll = function (callback) {
    callback([{
        'some' : 'json'
    }, {
        'another' : 'json'
    }]);
};

module.exports = MyModel;