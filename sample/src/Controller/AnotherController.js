function AnotherController() {

}

AnotherController.prototype.get = function (callback) {
    var $this = this;
    var start = new Date();
    var limit = this.query.limit ? this.query.limit : 100;
    return this.model('AnotherModel').find(function (rows) {
        $this.logger.info('[AnotherController] Time: ' + (new Date().getTime() - start.getTime()) + 'ms');
        callback(rows);
    }, limit);
}

module.exports = AnotherController;