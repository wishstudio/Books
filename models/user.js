var bookshelf = require('bookshelf').DB;

exports.User = bookshelf.Model.extend({
    tableName: 'users',

    authenticate: function (req) {
        var cookies = req.cookies;
        cookies.id
    }
});
