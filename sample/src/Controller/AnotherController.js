function AnotherController() {

}

AnotherController.prototype.get = function (callback) {
    return this.model('AnotherModel').find(function (rows) {
        callback(rows);
    });
}

module.exports = AnotherController;