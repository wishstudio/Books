var bookshelf = require('bookshelf').DB;

exports.Invoice = bookshelf.Model.extend({
    tableName: 'invoices'
});
