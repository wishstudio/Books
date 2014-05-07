var express = require('express');
var handlebars = require('express-hbs');

var app = express();

/* Initialize express and express-hbs */
app.engine('hbs', handlebars.express3({
    partialsDir: __dirname + '/views/partials',
    defaultLayout: __dirname + '/views/layout/default.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/views/assets'));

/* Initialize bookshelf */
var Bookshelf = require('bookshelf');
Bookshelf.DB = Bookshelf.initialize({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'book',
        password: 'book',
        database: 'book',
        charset: 'UTF8_GENERAL_CI'
    }
});

app.get('/login', function(req, res) {
});

app.get('/', function(req, res) {
});

var server = app.listen(8888, function() {
    console.log('Listening on port %d', server.address().port);
});
