var config = require('./config');
var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var cookieSession = require('cookie-session');
var Promise = require('bluebird');
var crypto = require('crypto');
var sequelize = new Sequelize(config.db_url);
var models = require('./models')(Sequelize, sequelize);
var middleware = require('./middleware');
var dokku = require('./dokku');
sequelize.sync();

var app = express();

app.use(serveStatic('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: [config.cookie_key1, config.cookie_key2]
}));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index', {
    title: config.title
  });
});

app.get('/app/list', middleware.loggedIn, function (req, res) {
  var user;
  models.User.findOne({
    username: req.session.user.username
}).then(function(u) {
    if(!u) {
      throw 'Inexist User';
    }
    user = u
    return user.getApps();
  }).then(function(apps) {
    res.render('app_list', {
      title: config.title + " - App",
      apps: apps,
      user: user
    });
  })
});

app.get('/app/info/:name/:func', middleware.loggedIn, function (req, res){
  var names = ['Overview', 'Resource', 'Collaborator', 'Settings'];
  res.render('app_info', {
    title: config.title + " - App Information",
    app: req.params.name,
    funcs: names,
    func: req.params.func
  });
});

app.get('/app/create', middleware.loggedIn, function (req, res) {
  res.render('app_create', {
    title: config.title + " - Create New App"
  });
});

app.post('/app/create', middleware.loggedIn, function (req, res) {
  if(!req.body.name) {
    req.session.flash = 'Missing Parameter';
    return res.redirect('/app/create');
  }
  var app, user, keys;
  Promise.props({
    app: models.App.create({
      name: req.body.name
    }),
    user: models.User.findOne({
      username: req.session.user.username
    })
  }).then(function(results) {
    app = results.app;
    user = results.user;
    return new Promise.props([
      user.getKeys(),
      results.app.addUser(results.user)
    ]);
  }).then(function(results){
    keys = results[0];
  }).then(function() {
    dokku(['create', app.name], '');
    if(keys.length) {
      dokku(['deploy:allow', app.name], keys[0].value);
    }
    req.session.flash = 'Success!';
    res.redirect('/app/list')
  }).catch(function(e) {
    req.session.flash = 'Duplicate App Name';
    req.redirect('/app/create');
  });
});

app.get('/database/list', middleware.loggedIn, function (req, res) {
  res.render('database_list', {
    title: config.title + " - Database"
  });
});

app.get('/database/create', middleware.loggedIn, function (req, res){
	res.render('database_create', {
    title: config.title + " - Create New Database"
  });
});

app.get('/login', function (req, res) {
  res.render('login', {
    title: config.title + ' - Login'
  });
});

app.post('/login', function (req, res) {
  if(!req.body.username || !req.body.password) {
    return res.end();
  }
  models.User.findOne({
    username: req.body.username
  }).then(function(user) {
    user.verifyPassword(req.body.password).then(function() {
      req.session.user = {
        username: user.username,
        email: user.email,
        avatar: 'https://gravatar.com/avatar/' + crypto.createHash('md5').update(user.email).digest('hex')
      };
      res.redirect('/app/list');
    });
  }).catch(function(err) {
    req.session.flash = 'Wrong Password';
    res.redirect('/login');
  });
});

app.get('/signup', function (req, res) {
  res.render('signup', {
    title: config.title + ' - Signup'
  });
});

app.post('/signup', function (req, res) {
  if(!req.body.username || !req.body.password) {
    return res.end();
  }
  models.User.findOne({
    username: req.body.username
  }).then(function(user) {
      if(user){
          throw "Duplicate Username";
      }
      return models.User.create({
          username: req.body.username,
          password: req.body.password,
          email: req.body.email
      });
  }).then(function(){
      req.session.flash = "Success Signup";
      res.redirect('/');
  }).catch(function(err) {
    req.session.flash = err;
    res.redirect('/signup');
  });
});

app.get('/hello/:name', function (req, res) {
  res.send('Hello ' + req.params.name + '!');
});

var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening on port ' + listener.address().port);
});
