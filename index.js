const AWSXRay = require('aws-xray-sdk');
const XRayExpress = AWSXRay.express;
const express = require('express');
const fs = require('fs');

// Capture all AWS clients we create
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
AWS.config.update({region: process.env.DEFAULT_AWS_REGION || 'us-west-2'});

// Capture all outgoing https requests
AWSXRay.captureHTTPsGlobal(require('https'));
const https = require('https');

// Capture MySQL queries
const mysql = AWSXRay.captureMySQL(require('mysql'));

const app = express();
const port = 3000;

function random_item(items)
{ 
return items[Math.floor(Math.random()*items.length)];     
}

async function random_log()
{ 
var uidlist = ['joe.user@gmail.com', 'mike.user@yahoo.com', 'susan.user@amazon.com', 'debbie.user@aol.com', 'tim.user@gmail.com'];
var iplist = ['10.0.0.165', '10.5.23.124', '10.30.86.98', '192.168.0.43', '192.168.3.4'];
var sevlist = ['INFO', 'WARN', 'ERROR', 'INFO', 'INFO', 'INFO', 'INFO', 'INFO', 'INFO', 'INFO', 'WARN'];
var browserlist = ['Chrome v7.0', 'Chrome v7.1', 'Chrome v7.2', 'Chrome v7.1', 'Chrome v7.1', 'Chrome v7.2', 'Firefox v10', 'Firefox v10', 'Firefox v10', 'Firefox v11', 'Firefox v11','Microsoft Edge','Microsoft Edge','Microsoft Edge'];
  for(var start = 1; start < 100; start++) {
	  var timestamp = Date.now ();
	  var date = new Date(timestamp).toISOString();
	  sev = random_item(sevlist);
	  browser = random_item(browserlist);
	  uid = random_item(uidlist);
	  ip = random_item(iplist);
	  var log = '{"Severity": "'+sev+'", "message": "This is where the message detail would go", "IP Address": "'+ip+'", "Timestamp": "'+date+'", "Browser": "'+browser+'","User ID": "'+uid+'"}';
	  //var log = date+'	'+act+'	'+pth;
	  fs.appendFile('/opt/sampleapp/application.log', log+ '\n', function (err) {
	  if (err) return console.log(err);
	  });

  };
    
}



app.use(XRayExpress.openSegment('SampleSite'));

app.get('/', (req, res) => {
  const seg = AWSXRay.getSegment();
  const sub = seg.addNewSubsegment('customSubsegment');
  setTimeout(() => {
    sub.close();
    res.sendFile(`${process.cwd()}/index.html`);
  }, 500);
});

app.get('/aws-sdk/', (req, res) => {
  const ddb = new AWS.DynamoDB();
  const ddbPromise = ddb.listTables().promise();

  ddbPromise.then(function(data) {
    res.send(`ListTables result:\n ${JSON.stringify(data)}`);
  }).catch(function(err) {
    res.send(`Encountered error while calling ListTables: ${err}`);
  });
});

app.get('/logger/', (req, res) => {
  for(var start = 1; start < 100; start++) {
	  var timestamp = Date.now ();
	  random_log()
	  var log = timestamp+'	'+logitem;
	  fs.appendFile('/opt/sampleapp/application.log', log+ '\n', function (err) {
	  if (err) return console.log(err);
	  console.log('Hello World > helloworld.txt');
	  });
	res.send(`100 log entries generated, click <a href="/test/">here</a> to generate more`);  
  };
}); 

app.get('/test/', (req, res) => {
  random_log();
  res.send(`100 log entries generated, click <a href="/test/">here</a> to generate more`);  
  }); 
  

app.get('/http-request/', (req, res) => {
  const endpoint = 'https://amazon.com/';
  https.get(endpoint, (response) => {
    response.on('data', () => {});

    response.on('error', (err) => {
      res.send(`Encountered error while making HTTPS request: ${err}`);
    });

    response.on('end', () => {
      res.send(`Successfully reached ${endpoint}.`);
    });
  });
});

app.get('/mysql/', (req, res) => {
  const mysqlConfig = require('./mysql-config.json');
  const config = mysqlConfig.config;
  const table = mysqlConfig.table;

  if (!config.user || !config.database || !config.password || !config.host || !table) {
    res.send('Please correctly populate mysql-config.json');
    return;
  }

  const connection = mysql.createConnection(config);
  connection.query(`SELECT * FROM ${table}`, (err, results, fields) => {
    if (err) {
      res.send(`Encountered error while querying ${table}: ${err}`);
      return;
    }
    res.send(`Retrieved the following results from ${table}:\n${results}`);
  });

  connection.end();
});

app.use(XRayExpress.closeSegment());

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

