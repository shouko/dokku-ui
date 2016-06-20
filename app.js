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
      user: req.session.user
    });
  })
});

app.get('/app/info/:name/:func', middleware.loggedIn, function (req, res) {
  var names = ['Overview', 'Resource', 'Collaborator', 'Settings'];
  var app;
  models.User.findOne({
    name: req.session.user.username
  }).then(function(user) {
    return user.getApps({ name: req.params.name });
  }).then(function(a) {
      if (a){
          app = a[0];
          return app.getUsers();
      }
      throw "App Not found";
  }).then(function(collaborators) {
    console.log(collaborators);
    var own;
    for (var i = 0; i < collaborators.length; i++) {
        if (collaborators[i].app_user.type == "owner"){
            own = collaborators[i];
            collaborators.splice(i, 1);
            break;
        }
    }
    res.render('app_info', {
      title: config.title + " - App Information",
      app: app,
      funcs: names,
      func: req.params.func,
      user: req.session.user,
      owner: own,
      collaborators: collaborators
    });
  }).catch(function(e) {
    req.session.flash = 'Error Creating App';
    res.redirect('/app/create');
  });
});

app.post('/app/info/:name/Resource', middleware.loggedIn, function (req, res) {
  if(!req.body.type) {
    req.session.flash = 'Missing Parameter';
    return res.redirect('/app/list');
  }
  var app;
  models.User.findOne({
    name: req.session.user.username
  }).then(function(user) {
    return user.getApps({ name: req.params.name });
  }).then(function(apps) {
    if(!apps) {
      throw 'Error Creating Database';
    }
    app = apps[0];
    return models.Database.create({
      name: req.body.name,
      type: req.body.type
    });
  }).then(function(database) {
    return database.addApp(app);
  }).then(function() {
    dokku([req.body.type + ':create', req.params.name], '');
    dokku([req.body.type + ':link', app.name, req.params.name], '');
  }).then(function() {
    req.session.flash = 'Success!';
    res.redirect('/app/' + req.params.name + '/Resource');
  }).catch(function(e) {
    req.session.flash = e;
    res.redirect('/app/list');
  });
});

app.post('/app/info/:name/Collaborator', middleware.loggedIn, function (req, res) {
  if(!req.body.name) {
    req.session.flash = 'Missing Parameter';
    return res.redirect('/app/list');
  }
  var app;
  models.User.findOne({
    name: req.session.user.username
  }).then(function(user) {
    return user.getApps({ name: req.params.name });
  }).then(function(apps) {
    if(!apps) {
      throw 'Error Adding Collaborators';
    }
    app = apps[0];
    return models.User.findOne({
      username: req.body.name
    });
  }).then(function(user) {
    return user.addApp(app, { type: 'collaborator' });
  }).then(function() {
    dokku([req.body.type + ':create', req.params.name], '');
    dokku([req.body.type + ':link', app.name, req.params.name], '');
  }).then(function() {
    req.session.flash = 'Success!';
    res.redirect('/app/' + req.params.name + '/Collaborator');
  }).catch(function(e) {
    req.session.flash = e;
    res.redirect('/app/list');
  });
});

app.post('/app/info/:name/Settings', middleware.loggedIn, function (req, res) {

});

app.get('/app/create', middleware.loggedIn, function (req, res) {
  res.render('app_create', {
    title: config.title + " - Create New App",
    user: req.session.user
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
      results.app.addUser(results.user, { type: 'owner' })
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
    req.session.flash = 'Error when Creating App';
    res.redirect('/app/create');
  });
});

app.get('/database/list', middleware.loggedIn, function (req, res) {
  res.render('database_list', {
    title: config.title + " - Database",
    user: req.session.user,
    db: [
      {
        name: 'db_1',
        type: 'mongodb',
        createdAt : '2015/12/01'
      },{
        name: 'db_2',
        type: 'mariadb',
        createdAt : '2015/12/01'
      },{
        name: 'db_3',
        type: 'redis',
        createdAt : '2015/12/01'
      },{
        name: 'db_4',
        type: 'mariadb',
        createdAt : '2015/12/01'
      }
    ]
  });
});

// app.get('/database/create', middleware.loggedIn, function (req, res){
// 	res.render('database_create', {
//     title: config.title + " - Create New Database",
//     user: req.session.user
//   });
// });

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
