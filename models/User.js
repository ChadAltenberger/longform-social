const bcrypt = require('bcryptjs');
const usersCollection = require('../db').db().collection('users');
const validator = require('validator');
const md5 = require('md5');

let User = function (data) {
	this.data = data;
	this.errors = [];
};

// CLEAN UP INPUTS
User.prototype.cleanUp = function () {
	if (typeof this.data.username != 'string') {
		this.data.username = '';
	}
	if (typeof this.data.email != 'string') {
		this.data.email = '';
	}
	if (typeof this.data.password != 'string') {
		this.data.password = '';
	}

	// get rid of any bogus properties
	this.data = {
		username: this.data.username.trim().toLowerCase(),
		email: this.data.email.trim().toLowerCase(),
		password: this.data.password
	};
};

// VALIDATE FORM INPUTS
User.prototype.validate = function () {
	return new Promise(async (resolve, reject) => {
		if (this.data.username == '') {
			this.errors.push('You must provide a username');
		}
		if (
			this.data.username != '' &&
			!validator.isAlphanumeric(this.data.username)
		) {
			this.errors.push('Username must only contain letters and numbers');
		}
		if (!validator.isEmail(this.data.email)) {
			this.errors.push('You must provide a valid email address');
		}
		if (this.data.password == '') {
			this.errors.push('You must provide a password');
		}
		if (this.data.password.length > 0 && this.data.password.length < 12) {
			this.errors.push('Password must contain at least 12 characters');
		}
		if (this.data.password.length > 50) {
			this.errors.push('Password must not exceed 50 characters');
		}
		if (this.data.username.length > 0 && this.data.username.length < 3) {
			this.errors.push('Username must contain at least 3 characters');
		}
		if (this.data.username.length > 100) {
			this.errors.push('Username must not exceed 100 characters');
		}

		// Only if username is valid, then check to see if it's taken
		if (
			this.data.username.length > 2 &&
			this.data.username.length < 31 &&
			validator.isAlphanumeric(this.data.username)
		) {
			let usernameExists = await usersCollection.findOne({
				username: this.data.username
			});
			if (usernameExists) {
				this.errors.push(
					'This username is already taken. Please choose a differnt one.'
				);
			}
		}

		// Only if email is valid, then check to see if it's taken
		if (validator.isEmail(this.data.email)) {
			let emailExists = await usersCollection.findOne({
				email: this.data.email
			});
			if (emailExists) {
				this.errors.push('This email has already been used.');
			}
		}
		resolve();
	});
};

// LOGIN
User.prototype.login = function () {
	return new Promise((resolve, reject) => {
		this.cleanUp();
		usersCollection
			.findOne({ username: this.data.username })
			.then(attemptedUser => {
				if (
					attemptedUser &&
					bcrypt.compareSync(this.data.password, attemptedUser.password)
				) {
					this.data = attemptedUser;
					this.getAvatar();
					resolve('Congrats');
				} else {
					reject('Invalid username & password');
				}
			})
			.catch(() => {
				reject('Please try again later');
			});
	});
};

// REGISTER
User.prototype.register = function () {
	return new Promise(async (resolve, reject) => {
		// Step 1: Validate user data
		this.cleanUp();
		await this.validate();

		// Step 2: Only if there are no validation errors then save the data into a database
		if (!this.errors.length) {
			// hash user password
			let salt = bcrypt.genSaltSync(10);
			this.data.password = bcrypt.hashSync(this.data.password, salt);
			await usersCollection.insertOne(this.data);
			this.getAvatar();
			resolve();
		} else {
			reject(this.errors);
		}
	});
};

User.prototype.getAvatar = function () {
	this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
};

module.exports = User;
