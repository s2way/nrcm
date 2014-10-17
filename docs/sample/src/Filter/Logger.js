'use strict';

function Logger() {
    return;
}

Logger.prototype.filter = function (callback) {
    console.log(this.requestHeaders);
    console.log(this.payload);
    console.log(this.query);
    console.log(this.prefixes);
    console.log(this.appName);
    console.log(this.method);
    console.log(this.controller);


};

module.exports = Logger;