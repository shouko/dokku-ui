var config = require('./config');
var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser')
var Sequelize = require('sequelize');
var cookieSession = require('cookie-session')
var sequelize = new Sequelize(config.db_url);
var models = require('./models')(Sequelize, sequelize);
var middleware = require('./middleware');
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
  models.User.findOne({
    username: req.session.username
  }).getApps().then(function(apps) {
    res.render('app_list', {
      title: config.title + " - App",
      apps: apps
    });
  })
});

app.get('/app/info/:name', middleware.loggedIn, function (req, res){
  var names = ['Overview', 'Resource', 'Collaborator', 'Settings'];
  res.render('app_info', {
    title: config.title + " - App Information",
    funcs: names,
    func: req.query.func
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
  new Promise.props({
    app: models.App.create({
      name: req.body.name
    }),
    user: models.User.findOne({
      username: req.session.username
    })
  }).then(function(results) {
    return results.app.addUser(results.user);
  }).then(function() {
    req.session.flash = 'Success!';
    res.redirect('/app/list')
  });
});

app.get('/database', middleware.loggedIn, function (req, res) {
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
