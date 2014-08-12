var bodyParser = require('body-parser');
var dateFormat = require('dateformat');
var express = require('express');
var request = require('request');
var time = require('time')(Date);


var app = express();
app.use(bodyParser.json());


app.all('/stocks', function(req, res) {
  // logger.info(req.body);
  try {
    var symbol = req.body.data.symbol || 'TWTR';
  } catch (e) {}
  symbol = symbol || 'TWTR'

  var now = new Date();

  var open = '9:30 AM';
  var close = '4:00 PM';

  now.setTimezone('America/New_York');

  // TODO: Holidays?

  if (now.getHours() <= 9 && now.getMinutes() < 30) {
    // logger.info('Market hasn\'t opened today, reverting by a day');
    now.setTime(now.getTime() - (1000 * 60 * 60 * 24));
  }

  while (now.getDay() == 0 || now.getDay() == 6) {
    // logger.info('%s is a weekend day, reverting by a day', dateFormat(now, 'mm/dd/yyyy'));
    now.setTime(now.getTime() - (1000 * 60 * 60 * 24));
  }

  open = dateFormat(now, 'mm/dd/yyyy') + ' ' + open;
  close = dateFormat(now, 'mm/dd/yyyy') + ' ' + close;

  // logger.info('Open: %s, Close: %s', open, close);

  request.get('http://globalquotes.xignite.com/v3/xGlobalQuotes.json/GetBars?IdentifierType=Symbol&Identifier=' + symbol + '&StartTime=' + encodeURIComponent(open) + '&EndTime=' + encodeURIComponent(close) + '&Precision=Hours&Period=1&_Token=700444CDF49745DFAD5928EC1198A84C', function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var stockData = JSON.parse(body);
      var currentPrice = 0;
      if (!stockData || !stockData['Bars'] || !stockData['Bars'].length) {
        res.send({
          name: symbol.toUpperCase(),
          message: 'Couldn\'t fetch stock data'
        });
      } else {
        var bars = [];
        for (var i = 0; i < stockData['Bars'].length; i++) {
          var bar = stockData['Bars'][i];
          if (i == 0) {
            bars.push({
              x: i,
              xDisplay: 'open',
              y: bar['Open'],
              yDisplay: bar['Open'].toFixed(2)
            });
            currentPrice = bar['Close'];
          } else if (i == stockData['Bars'].length - 1) {
            bars.push({
              x: i,
              y: bar['Close'],
              yDisplay: bar['Close'].toFixed(2)
            });
            currentPrice = bar['Close'];
          } else {
            bars.push({
              x: i,
              y: bar['High'],
              yDisplay: bar['High'].toFixed(2)
            });
          }
        }

        var firstPriceToday;
        if (req.body.firstToday && req.body.firstToday.message) {
          firstPriceToday = parseFloat(req.body.firstToday.message.replace(/[^0-9-.]/g, '')).toFixed(2);
        }

        var response = {
          name: symbol.toUpperCase(),
          message: '$' + currentPrice.toFixed(2),
          attachments: [{
            type: 'series',
            data: bars
          }],
        };

        if (firstPriceToday) {
          var changeToday = (currentPrice - firstPriceToday).toFixed(2);
          var percentageChange = change = (changeToday / firstPriceToday * 100).toFixed(2);
          if (percentageChange < 0) {
            response['note'] = {
              type: 'bad'
            };
          } else if (percentageChange > 0) {
            response['note'] = {
              type: 'good'
            };
          }
          if (response['note']) {
            response['note']['message'] = (currentPrice - firstPriceToday) < 0 ? '-' : '+';
            response['note']['message'] += Math.abs(percentageChange) + '%';
          }
        }

        res.send(response);
      }
    } else {
      logger.error('Error with stock tracker.');
      if (error) {
        logger.trace(error.stack);
        res.send(500);
      } else {
        logger.error('Status code is: ' + response.statusCode);
        res.send(response.statusCode);
      }
    }
  });
});

app.all('/stocks/config', function(req, res) {
  res.render('stocks_config');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {});
console.log('Stocks-byte listening on :' + port);
