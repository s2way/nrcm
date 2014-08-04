function AnotherController() {

}

AnotherController.prototype.get = function (callback) {

    this.logger.info('[AnotherController] @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    return this.model('AnotherModel').find(function (rows) {
        callback(rows);
    });
}

module.exports = AnotherController;