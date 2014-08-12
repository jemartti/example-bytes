var express = require('express');
var bodyParser = require('body-parser');

var app = express();  
app.use(bodyParser.json());

app.all('/hellobyte', function (req, res) {  
	res.send({
    	message: 'You did it!',
        name: 'Hello Byte World'
    });  
    return;
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
});
