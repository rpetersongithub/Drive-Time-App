var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');



var port = process.env.PORT || 8080;

//app.use(cors());

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));




app.get('/', function(req, res){
  res.render('index');
});


// app.post('/', function(req, res){
//   console.log(req.body.min);
//   res.render('index');
// })

app.listen(port, function() {
    console.log('App is running on http://localhost:' + port);
});
