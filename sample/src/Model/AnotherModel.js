function AnotherModel() {
    this.dataSource = 'mysql';
}

AnotherModel.prototype.find = function (callback, limit) {
    var $this = this;
    this.$use('desenv', function (error) {
        if (error) {
            callback(error);
            return;
        }
        $this.$query('SELECT * FROM movimento LIMIT ' + limit, [], function (err, rows, fields) {
            callback(rows);
        });
    });
};

module.exports = AnotherModel;