let mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'ec2-18-222-6-224.us-east-2.compute.amazonaws.com',
    user: 'babyboiremote',
    password: 'babyboi',
    database: 'test',
    port: '3306'
});

let express = require('express');
let app = express();

let server = require('http').createServer(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/login.html');
});

connection.connect();

/*connection.query('INSERT INTO test (test) VALUES (\'eyyyy\')', function (error, results, fields) {
  if (error) throw error;
});*/
connection.query('SELECT * FROM test AS data', function(error, results, fields) {
    if (error) throw error;
    console.log(results[1].test);
});

connection.end();