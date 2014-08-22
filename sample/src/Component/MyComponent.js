'use strict';
function MyComponent() {
    return;
}

MyComponent.prototype.method = function (callback) {
    var anotherComponent = this.component('SubComponent.AnotherComponent');
    anotherComponent.nothing(callback);
};

module.exports = MyComponent;