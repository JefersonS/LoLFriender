/* Crawler:
	Look for initial ID,
	Find matches,
	Find related summoners,
	Fill db with necessary info (might come from different requisitions)
*/
/* Test case:
	Receive a name,
	Find by name,
	Receive ID,
	Look for db (filled by crawler) for matches
*/

/*var request = require('request');

request('http://www.google.com', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Show the HTML for the Google homepage. 
  }
})*/