var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');
var request = require('request');
var stockData = require('stock-data');
var _ = require('underscore');


var app = express();
app.use(bodyParser.json());
app.set('view engine', 'ejs');


app.all('/', function(req, res) {
  var symbol = (req.body.data && req.body.data.symbol) ? req.body.data.symbol : 'TWTR';

  // Set up the one week date range
  // 'America/New_York'
  var tzOffset = -4;
  var now = moment().utc().add(tzOffset);
  var then = now.clone().subtract(1, 'week');

  // Fetch the stock data from Yahoo! finance
  stockData.fetch({
    symbol: symbol,
    startDate: then.format('YYYY-MM-DD'),
    endDate: now.format('YYYY-MM-DD'),
    useCache: false
  }, function(err, data) {
    if (!err) {
      var bars = [];
      var latestClose = '';

      // Push each of the latest close values to the bars array
      _.each(data.adj_close, function(element, index, list) {
        latestClose = element.toFixed(2);

        bars.push({
          x: index,
          xDisplay: moment(data.date[index], 'YYYY-MM-DD').format('dd'),
          y: element,
          yDisplay: latestClose
        });
      });

      // Send the result back to the byte core
      res.send({
        name: symbol.toUpperCase(),
        message: 'Latest close: $' + latestClose,
        attachments: [{
          type: 'series',
          data: bars
        }],
      });
    } else {
      console.log('Error with stock tracker.');
      console.log(error.stack);
      res.send(500);
    }
  });
});

// On the config call, serve up the config page
app.all('/config', function(req, res) {
  res.render('stocks_config');
});

// Start the byte
var port = process.env.PORT || 5000;
app.listen(port, function() {});
console.log('Stocks-byte listening on :' + port);
