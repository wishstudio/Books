var bookshelf = require('bookshelf').DB;
var crypto = require('crypto');

exports.User = bookshelf.Model.extend({
    tableName: 'users',
}, {
    encryptPassword: function(password) {
        var hashed = crypto.pbkdf2Sync(password, 'BOOKS_APP_PBKDF2_SALT', 50000, 32);
        return Buffer(hashed, 'binary').toString('hex');
    }
});
