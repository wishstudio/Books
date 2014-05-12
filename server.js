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
app.use(express.cookieParser());
app.use(express.session({ secret: "Books app" }));
app.use(express.urlencoded());

/* Handlebars helpers */
handlebars.registerHelper('genderName', function(gender) {
    if (gender == 0)
        return '男';
    else if (gender == 1)
        return '女';
    else
        return '';
});

handlebars.registerHelper('orderStatusName', function(status) {
    if (status == 1)
        return '已支付';
    if (status == 2)
        return '已取消';
    else
        return '待支付';
})

/* Initialize database */
var bookshelf = require('bookshelf');
bookshelf.DB = bookshelf.initialize({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'books',
        password: 'books',
        database: 'books'
    }
});
var knex = bookshelf.DB.knex;

var User = require('./models/user').User;
var Book = require('./models/book').Book;
var Order = require('./models/order').Order;
var Invoice = require('./models/invoice').Invoice;

/* Set up routes */
app.get('/login', function(req, res) {
    res.render('login', { title: '登录系统' });
});

app.post('/login', function(req, res) {
    var name = req.body.name;
    var password = req.body.password;
    var hashed = User.encryptPassword(password);
    new User({ name: name, password: hashed }).fetch().then(function(user) {
        req.session.uname = user.get('name');
        req.session.upower = user.get('power');
        res.redirect('/');
    }).catch(function(err) {
        res.redirect('/login');
    })
});

app.all('*', function(req, res, next) {
    if (req.session.uname) {
        next();
    }
    else {
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res) {
    delete req.session.uname;
    delete req.session.upower;
    res.redirect('/');
});

app.get('/user', function(req, res) {
    res.render('user');
});

app.post('/user', function(req, res) {
    var uid = req.body.uid;
    var name = req.body.name;
    var realname = req.body.realname;

    User.collection().query(function(qb) {
        if (uid) {
            qb.where('uid', 'like', '%' + uid + '%');
        }
        if (name) {
            qb.where('name', 'like', '%' + name + '%');
        }
        if (realname) {
            qb.where('realname', 'like', '%' + realname + '%');
        }
    }).fetch().then(function(collection) {
        return collection.mapThen(function(user) {
            return user.toJSON();
        });
    }).then(function(users) {
        res.render('user', { user: users });
    }).catch(function() {
        res.redirect('/');
    });
});

app.get('/user/add', function(req, res) {
    res.render('userinfo');
});

app.get('/user/:id', function(req, res) {
    var id = req.params.id;
    new User({ id: id }).fetch().then(function(user) {
        res.render('userinfo', user.toJSON());
    }).catch(function() {
        res.redirect('/');
    });
});

app.post('/user/edit', function(req, res) {
    var id = req.body.id;
    var uid = req.body.uid;
    var name = req.body.name;
    var password = req.body.password;
    var email = req.body.email;
    var realname = req.body.realname;
    var gender = req.body.gender;
    var age = req.body.age;

    var succ = function(book) {
        res.redirect('/user/' + user.id);
    };

    var fail = function() {
        res.render('userinfo', {
            id: id,
            uid: uid,
            name: name,
            email: email,
            realname: realname,
            gender: gender,
            age: age
        });
    };

    var user = new User({
        uid: uid,
        name: name,
        email: email,
        realname: realname,
        gender: gender? gender: null,
        age: age
    })

    if (id) {
        user.set('id', id);
    }
    if (password) {
        user.set('password', User.encryptPassword(password));
    }
    user.save().then(succ).catch(fail);
});

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/book/add', function(req, res) {
    res.render('bookinfo', { stock: 0 });
});

app.get('/book/:id', function(req, res) {
    var id = req.params.id;
    new Book({ id: id }).fetch().then(function(book) {
        return Order.collection().query(function(qb) {
            qb.where('bookId', '=', id);
        }).fetch().then(function(collection) {
            return collection.mapThen(function(order) {
                return order.toJSON();
            });
        }).then(function(orders) {
            var info = book.toJSON();
            info.order = orders;
            res.render('bookinfo', info);
        });
    }).catch(function(err) {
        res.redirect('/');
    });
});

app.get('/book/:id/order', function(req, res) {
    var bookId = req.params.id;
    new Book({ id: bookId }).fetch().then(function(book) {
        res.render('orderinfo', { book: book.toJSON() });
    }).catch(function() {
        res.redirect('/');
    })
});

app.post('/book/:id/buy', function(req, res) {
    var bookId = req.params.id;
    var count = req.body.count;
    new Book({ id: bookId }).fetch().then(function(book) {
        if (book.get('stock') < count)
            throw 'Invalid state';
        book.set("stock", book.get('stock') - count);
        return book.save();
    }).then(function(book) {
        return new Invoice({
            logtime: Date.now(),
            type: '收入',
            message: '售出' + count + '本“' + book.get('title') + '” 收入' + count * book.get('price') + '元'
        }).save();
    }).then(function() {
        res.redirect('/book/' + bookId);
    }).catch(function() {
        res.redirect('/book/' + bookId);
    });
});

app.post('/book/edit', function(req, res) {
    var id = req.body.id;
    var isbn = req.body.isbn;
    var title = req.body.title;
    var publisher = req.body.publisher;
    var author = req.body.author;
    var price = req.body.price;
    var stock = 0;

    var succ = function(book) {
        res.redirect('/book/' + book.id);
    };

    var fail = function() {
        res.render('bookinfo', {
            id: id,
            isbn: isbn,
            title: title,
            publisher: publisher,
            author: author,
            price: price,
            stock: stock });
    }

    var book = new Book({
        isbn: isbn,
        title: title,
        publisher: publisher,
        author: author,
        price: price,
        stock: stock
    });
    if (id) {
        book.set("id", id);
    }
    book.save().then(succ).catch(fail);
});

app.get('/book', function(req, res) {
    res.render('book');
});

app.post('/book', function(req, res) {
    var isbn = req.body.isbn;
    var title = req.body.title;
    var publisher = req.body.publisher;
    var author = req.body.author;

    Book.collection().query(function(qb) {
        if (isbn) {
            qb.where('isbn', 'like', '%' + isbn + '%');
        }
        if (title) {
            qb.where('title', 'like', '%' + title + '%');
        }
        if (publisher) {
            qb.where('publisher', 'like', '%' + publisher + '%');
        }
        if (author) {
            qb.where('author', 'like', '%' + author + '%');
        }
    }).fetch().then(function(collection) {
        return collection.mapThen(function(book) {
            return book.toJSON();
        });
    }).then(function(books) {
        res.render('book', { book: books });
    }).catch(function() {
        res.redirect('/');
    });
});

app.get('/order/:id', function(req, res) {
    var id = req.params.id;
    new Order({ id: id }).fetch({ withRelated: [ 'book' ] }).then(function(order) {
        var info = order.toJSON();
        if (info.status != 0) {
            info.finalized = true;
        }
        res.render('orderinfo', info);
    }).catch(function() {
        res.redirect('/');
    });
});

app.get('/order/:id/cancel', function(req, res) {
    var id = req.params.id;
    new Order({ id: id }).fetch().then(function(order) {
        if (order.get("status") != 0) {
            throw "Invalid state";
        }
        order.set("status", 2);
        return order.save().then(function() {
            res.redirect('/order/' + id);
        });
    }).catch(function() {
        res.redirect('/');
    });
});

app.get('/order/:id/pay', function(req, res) {
    var id = req.params.id;
    new Order({ id: id }).fetch({ withRelated: 'book'}).then(function(order) {
        if (order.get("status") != 0) {
            throw "Invalid state";
        }
        order.set("status", 1);
        return bookshelf.DB.transaction(function(t) {
            return order.save(null, { transacting: t }).then(function() {
                return knex('books').transacting(t).where('id', '=', order.get('bookId')).increment('stock', order.get('count'));
            }).then(function() {
                throw 'error';
                var info = order.toJSON();
                return new Invoice({
                    logtime: Date.now(),
                    type: '支出',
                    message: '从“' + info.upstream + '”进货' + info.count + '本“' + info.book.title
                        + '” 支出了' + info.uprice * info.count + '元'
                }).save(null, { transacting: t })
            }).then(function() {
                t.commit();
                res.redirect('/order/' + id);
            }).catch(function(err) {
                t.rollback();
                res.redirect('/order/' + id);
            });
        });
    }).catch(function(err) {
        res.redirect('/order/' + id);
    })
});

app.post('/order/edit', function(req, res) {
    var id = req.body.id;
    var bookId = req.body.bookId;
    var upstream = req.body.upstream;
    var price = req.body.price;
    var count = req.body.count;
    var succ = function(order) {
        res.redirect('/order/' + order.id);
    };
    var order = new Order({
        upstream: upstream,
        uprice: price,
        count: count
    });
    if (id) {
        order.set('id', id);
    }
    else {
        order.set('bookId', bookId);
        order.set('status', 0);
    }
    order.save().then(succ);
});

app.get('/order', function(req, res) {
    Order.collection().query(function(qb) {
    }).fetch({ withRelated: [ 'book' ] }).then(function(collection) {
        return collection.mapThen(function(order) {
            return order.toJSON();
        });
    }).then(function(orders) {
        res.render('order', { order: orders });
    }).catch(function(err) {
        res.redirect('/');
    });
});

app.get('/invoice', function(req, res) {
    Invoice.collection().query(function(qb) {
    }).fetch().then(function(collection) {
        return collection.mapThen(function(invoice) {
            return invoice.toJSON();
        });
    }).then(function(invoices) {
        res.render('invoice', { invoice: invoices });
    }).catch(function() {
        res.redirect('/');
    });
});

/* Initialize models */
var schema = require('./schema');

schema.initialize().then(function() {
    var server = app.listen(8888, function() {
        console.log('Listening on port %d', server.address().port);
    });
});
