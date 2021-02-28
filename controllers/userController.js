const md5 = require('md5');
const User = require('../models/User');

exports.mustBeLoggedIn = (req, res, next) => {
	if (req.session.user) {
		next();
	} else {
		req.flash('errors', 'You must be logged in to perform that action.');
		req.session.save(() => {
			res.redirect('/');
		});
	}
};

// LOGIN
exports.login = (req, res) => {
	let user = new User(req.body);
	user
		.login()
		.then(result => {
			req.session.user = {
				avatar: user.avatar,
				username: user.data.username,
				_id: user.data._id
			};
			req.session.save(() => {
				res.redirect('/');
			});
		})
		.catch(e => {
			req.flash('errors', e);
			req.session.save(() => {
				res.redirect('/');
			});
		});
};

// LOGOUT
exports.logout = (req, res) => {
	req.session.destroy(() => {
		res.redirect('/');
	});
};

// REGISTER
exports.register = (req, res) => {
	let user = new User(req.body);
	user
		.register()
		.then(() => {
			req.session.user = {
				avatar: user.avatar,
				username: user.data.username,
				_id: user.data._id
			};
			req.session.save(() => {
				res.redirect('/');
			});
		})
		.catch(regErrors => {
			regErrors.forEach(error => {
				req.flash('regErrors', error);
			});
			req.session.save(() => {
				res.redirect('/');
			});
		});
};

// HOME
exports.home = (req, res) => {
	if (req.session.user) {
		res.render('home-dashboard');
	} else {
		res.render('home-guest', {
			errors: req.flash('errors'),
			regErrors: req.flash('regErrors')
		});
	}
};
