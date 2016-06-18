var config = require('./config');
var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser')
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.db_url);
var Models = require('./models')(Sequelize, sequelize);
sequelize.sync();

var app = express();

app.use(serveStatic('public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index', {
      title: config.title
  });
});

app.get('/app/list', function (req, res) {
    res.render('app_list', {
      title: config.title + " - App"
  });
});

app.get('/app/info/:name', function(req, res){
	res.render('app_info', {
        title: config.title + " - App Information"
    });
});

app.get('/app/create', function (req, res) {
  res.render('app_create', {
      title: config.title + " - Create New App"
  });
});

app.get('/database', function (req, res) {
  res.render('database_list', {
      title: config.title + " - Database"
  });
});

app.get('/database/create', function(req, res){
	res.render('database_create', {
        title: config.title + " - Create New Database"
    });
});

app.get('/hello/:name', function (req, res) {
  res.send('Hello ' + req.params.name + '!');
});

var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening on port ' + listener.address().port);
});
