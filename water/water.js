var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');
var request = require('request');
var _ = require('underscore');


var app = express();
app.use(bodyParser.json());


app.all('/', function(req, res) {
  // Restore the data from the last update, if it exists
  var latestCheck = (req.body.data && req.body.data.latestCheck) ? req.body.data.latestCheck : 0;
  var drinkHistory = (req.body.data && req.body.data.drinkHistory) ? req.body.data.drinkHistory : [
    [],
    [],
    [],
    [],
    [],
    [],
    []
  ];

  // Shift the drinkHistory, if it's now the next day
  var now = Math.round(new Date().getTime() / 1000.0);
  if (latestCheck !== 0) {
    var diff = Math.floor(((latestCheck + 86400.0) - now) / 86400.0);
    if (diff > 0) {
      drinkHistory.pop();
      drinkHistory.unshift([]);
    }
  }
  latestCheck = now;

  // increment today's drinks if the drink button is pushed
  if (req.body.action && req.body.action.name && req.body.action.name == 'drink') {
    drinkHistory[0].push(now);
  }

  // Populate the graph data
  var graph = [];
  var todayLabel = moment().startOf('day').unix();
  _.each(drinkHistory, function(element, index, list) {
    graph.unshift({
      x: index,
      y: drinkHistory[index].length,
      yDisplay: String(drinkHistory[index].length),
      xDisplay: moment.unix(todayLabel).format('dd')
    });

    todayLabel -= 86400;
  });

  // Send the response to the Byte Core
  res.send({
    name: 'Water',
    message: drinkHistory[0].length + (drinkHistory[0].length === 1 ? ' drink' : ' drinks') + ' today',
    attachments: [{
      type: 'series',
      title: 'Last 7 days',
      data: graph
    }],
    inputs: [{
      type: 'button',
      name: 'drink',
      label: 'Drink'
    }],
    data: {
      drinkHistory: drinkHistory,
      latestCheck: latestCheck
    }
  });
});


// Start the byte
var port = process.env.PORT || 5000;
app.listen(port, function() {});
console.log('Water-byte listening on :' + port);
