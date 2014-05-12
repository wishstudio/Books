var bookshelf = require('bookshelf').DB;
var knex = bookshelf.knex;
var User = require('./models/User').User;

function createTable(tableName, table, model, initialData) {
    return knex.schema.hasTable(tableName).then(function(exists) {
        if (!exists) {
            var p = knex.schema.createTable(tableName, table);
            if (model) {
                return p.then(function() {
                    return new model(initialData).save();
                });
            }
            else {
                return p;
            }
        }
    });
}

exports.initialize = function() {
    return createTable('users', function(table) {
        table.increments('id').primary();
        table.string('name', 30).notNullable().unique();
        table.string('password', 80).notNullable();
        table.string('email', 50).notNullable();
        table.string('realname', 30);
        table.string('uid', 50);
        table.boolean('gender');
        table.integer('age').unsigned();
        table.dateTime('registrationTime').notNullable();
        table.integer('power').notNullable();
    }, User, {
        name: 'admin',
        password: 'a2e942c962f4f4c2c00930d1fde2d5da9df61e6bd2852914c69f18303d70055a', /* 123 */
        email: 'admin@admin.com',
        realname: '',
        uid: '',
        gender: false,
        age: 0,
        registrationTime: Date.now(),
        power: 1
    }).then(function() {
        return createTable('books', function(table) {
            table.increments('id').primary();
            table.string('isbn', 20).notNullable().unique();
            table.string('title', 50).notNullable();
            table.string('publisher', 50);
            table.string('author', 30);
            table.decimal('price').notNullable();
            table.integer('stock').defaultTo(0).unsigned().notNullable();
        });
    }).then(function() {
        return createTable('orders', function(table) {
            table.increments('id').primary();
            table.integer('bookId').notNullable();
            table.string('upstream').notNullable();
            table.integer('count').unsigned().notNullable();
            table.decimal('uprice').notNullable();
            table.integer('status').notNullable();
        });
    }).then(function() {
        return createTable('invoices', function(table) {
            table.increments('id').primary();
            table.dateTime('logtime').notNullable();
            table.string('type', 20).notNullable();
            table.string('message', 100).notNullable();
        });
    });
}
