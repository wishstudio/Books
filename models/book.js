var bookshelf = require('bookshelf').DB;

exports.Book = bookshelf.Model.extend({
    tableName: 'books'
});
