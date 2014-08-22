'use strict';
function AnotherComponent() {
    return;
}

AnotherComponent.prototype.nothing = function (callback) {
    callback({
        'a' : 'json'
    });
};

module.exports = AnotherComponent;