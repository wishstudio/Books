var bookshelf = require('bookshelf').DB;
var Book = require('./book').Book;

exports.Order = bookshelf.Model.extend({
    tableName: 'orders',

    book: function() {
        return this.belongsTo(Book, 'bookId')
    }
});
