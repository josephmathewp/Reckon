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
    textToSearchValue: function(callback) {
      request('https://join.reckon.com/test2/textToSearch', function (error, response, body) {
        
          if (!error && response.statusCode == 200) {
              callback(null, body);
          } else {
            callback(true, {});
          }
      });
    },
    subTextsValues: function(callback) {
      request('https://join.reckon.com/test2/subTexts', function (error, response, body) {

          if (!error && response.statusCode == 200) {
              callback(null, body);
          } else {
            callback(true, {});
          }
      });
    }
  }, function(err, results) {

    const textToSearch = JSON.parse(results.textToSearchValue);
    const subTexts = JSON.parse(results.subTextsValues);
    var resultString=[];

    var resultJSON = {'candidate': 'Joseph Mathew',
                        'text': textToSearch.text,
                    'results': []}
        var st = null;

        var _result = "";

        var textToSearchC = textToSearch.text.toUpperCase();

        var loopCount = 0;
        subTexts.subTexts.forEach(subText => {
            loopCount++;
            var matchFound = 0;

            if (textToSearch.length < subText.length || subText.length == 0 || textToSearch.length == 0) {
                st = "<No Output>";
            } else {
            
            var subTextC = subText.toUpperCase();
            let subTextLength = subText.length;
            var matchLocationString = '';

            for (var i = 0; i <= (textToSearchC.length - (subTextLength + 1)); i++) {
                loopCount++;
                
                var _location = i;
                var _isMatch = 1;

                    if (textToSearchC[i] == subTextC[0] && textToSearchC[(i+subTextLength - 1)] == subTextC[subTextLength - 1]) {
                        var stIndex = 1;

                        for (var ii = i+1; ii <= (i + subTextLength - 2); ii++) {
                            loopCount++;
                            if(textToSearchC[ii] != subTextC[stIndex]){
                                _isMatch = 0;
                                break;
                            } else {
                                stIndex++;
                            }
                        }
                        
                    } else {
                        _isMatch = 0;
                    }

                    if(_isMatch == 1) {
                        if(matchLocationString.length > 0) {
                            matchLocationString += ', ';
                        }
                        matchLocationString +=i+1;
                        matchFound = 1;
                    }    
                }
            }

            if(matchFound == 0) {
                matchLocationString += '<No Output>';
            }

            resultJSON['results'].push({'subtext': subText, 'result': matchLocationString})
        }
    );
    
    console.log(resultJSON);
    console.log(loopCount);
    resp.view('indexString', { result: JSON.stringify(resultJSON)}); 
  })
}});
