var bookshelf = require('bookshelf').DB;
var knex = bookshelf.knex;

function createTable(tableName, table) {
    return knex.schema.hasTable(tableName).then(function(exists) {
        if (!exists) {
            return knex.schema.createTable(tableName, table);
        }
    });
}

exports.initialize = function() {
    return createTable('users', function(table) {
        table.increments('id').primary();
        table.string('name', 30).notNullable();
        table.string('password', 50).notNullable();
        table.string('email', 50).notNullable();
        table.string('realname', 30);
        table.string('uid', 50);
        table.boolean('gender');
        table.integer('age');
        table.dateTime('registrationTime').notNullable();
        table.integer('power').notNullable();
    }).then(function() {
        return createTable('books', function(table) {
            table.increments('id').primary();
            table.string('isbn', 20).notNullable();
            table.string('title', 50).notNullable();
            table.string('publisher', 50);
            table.string('author', 30);
            table.decimal('price').notNullable();
            table.integer('stock').defaultTo(0).notNullable();
        });
    }).then(function() {
        return createTable('orders', function(table) {
            table.increments('id').primary();
            table.integer('bookId').notNullable();
            table.string('upstream').notNullable();
            table.integer('count').notNullable();
            table.decimal('uprice').notNullable();
            table.integer('status').notNullable();
        });
    }).then(function() {
        return createTable('invoices', function(table) {
            table.increments('id').primary();
            table.dateTime('logtime');
            table.string('type', 20);
            table.string('message', 100);
        });
    });
}
