var express = require('express');
var serveStatic = require('serve-static');
var app = express();

app.use(serveStatic('public'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/hello/:name', function (req, res) {
  res.send('Hello ' + req.params.name + '!');
});

var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening on port ' + listener.address().port);
});
