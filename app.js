var config = require('./config');
var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser')
var Sequelize = require('sequelize');
var cookieSession = require('cookie-session')
var sequelize = new Sequelize(config.db_url);
var models = require('./models')(Sequelize, sequelize);
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

app.get('/app/list', loggedIn, function (req, res) {
  res.render('app_list', {
    title: config.title + " - App"
  });
});

app.get('/app/info/:name', loggedIn, function(req, res){
	res.render('app_info', {
    title: config.title + " - App Information"
  });
});

app.get('/app/create', loggedIn, function (req, res) {
  res.render('app_create', {
    title: config.title + " - Create New App"
  });
});

app.get('/database', loggedIn, function (req, res) {
  res.render('database_list', {
    title: config.title + " - Database"
  });
});

app.get('/database/create', loggedIn, function(req, res){
	res.render('database_create', {
    title: config.title + " - Create New Database"
  });
});

app.post('/login', function(req, res) {
  if(!req.body.username || !req.body.password) {
    return res.end();
  }
  models.User.findOne({
    username: req.body.username
  }).then(function(user) {
    user.verifyPassword(req.body.password).then(function() {
      req.session.username = user.username;
      res.redirect('/app/list');
    });
  }).error(function(err) {
    req.session.flash = 'Wrong Password';
    res.redirect('/login');
  });
});

app.get('/hello/:name', function (req, res) {
  res.send('Hello ' + req.params.name + '!');
});

var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening on port ' + listener.address().port);
});
