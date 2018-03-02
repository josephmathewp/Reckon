const Hapi = require('hapi');
var http = require('http');
const Vision = require('vision');
var async = require('async');
var request = require('request');
const Handlebars = require('handlebars');

const server = new Hapi.Server();


server.connection({
  host: '127.0.0.1',
  port: 3000
});

server.register(Vision, (err) => {
  server.views({
      engines: {
          html: Handlebars
      },
      relativeTo: __dirname,
      path: './views',
  });
});

server.start((err) => {
  if (err) {
      throw err;
  }

  console.log(`Server running at: ${server.info.uri}`);
});

// console.log('node.js application starting...');

server.route({
  method: 'GET',
  path: '/',
  handler: function(req, resp) {
  async.parallel({
    rangeInfo: function(callback) {
      request('https://join.reckon.com/test1/rangeInfo', function (error, response, body) {
        
          if (!error && response.statusCode == 200) {
              callback(null, body);
          } else {
            callback(true, {});
          }
      });
    },
    divisorInfo: function(callback) {
      request('https://join.reckon.com/test1/divisorInfo', function (error, response, body) {

          if (!error && response.statusCode == 200) {
              callback(null, body);
          } else {
            callback(true, {});
          }
      });
    }
  }, function(err, results) {

    const rangeData = JSON.parse(results.rangeInfo);
    const divisorInfo = JSON.parse(results.divisorInfo);
    var resultString=[];

    const lb  = rangeData.lower;
    const ub  = rangeData.upper;

    if (lb <= ub) {
        for ( var i = lb; i <= ub; i++) {
            resultString[i] = i + ': ';
        }

        divisorInfo.outputDetails.forEach(element => {
            var divisorNum = lb;
            for ( var num = lb; num <= ub; num++) {
              if (num != 0 & num % element.divisor === 0) {
                  divisorNum = num;
                  break;
              }
            }
            for ( var resNum = divisorNum; resNum <= ub; resNum = resNum + element.divisor) {
                resultString[resNum] += element.output;
            }
        });
    }

    resp.view('index', { result: resultString}); 
  });
}
});
