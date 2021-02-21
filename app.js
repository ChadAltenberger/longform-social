const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const app = express();

const sessionOptions = session({
	secret: 'The tea in Napal is very hot.',
	store: new MongoStore({ client: require('./db') }),
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
});

app.use(sessionOptions);

const router = require('./router');

app.use(express.urlencoded({ extended: false })); // Enable req access to body object "req.body"
app.use(express.json());

app.use(express.static('public'));
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use('/', router);

module.exports = app;
