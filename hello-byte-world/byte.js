var express = require('express');

var app = express();

app.all('/', function(req, res) {
  res.send({
    message: 'You did it!',
    name: 'Hello Byte World'
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {});
