/* Crawler:
	Look for initial ID,
	Find matches,
	Find related summoners,
	Fill db with necessary info (might come from different requisitions),
	** NO MORE CRAWLER **
*/
/* Test case:
	Receive a name,
	Find ID by name,
	Receive ID,
	Look for recently played games,
	Fill db with who is looking + each friend,
	Cross informations
*/

/*
	request id by name
		request matches by id
			fill mongo with each summoner
				for each summoner find their elo
					maybe find each one last matches, then count their recent roles and champions
				
 */	

var request = require('request');
var waterfall = require("async/waterfall");
var each = require("async/each");
var whilst = require("async/whilst");
var MongoClient = require("mongodb").MongoClient;
var id = 4030160;

waterfall([
    function(callback) {
		request('https://br.api.pvp.net/api/lol/br/v1.4/summoner/by-name/Haiyk?api_key=c85a3b8f-e5d7-4bd2-8416-f4f6950a3c61', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    body = (JSON.parse(body));
        	callback(null, body["haiyk"].id);
		  }else{
		  	callback({error: error, response: response});
		  }
		});
    },
   function(arg1, callback) {
		request('https://br.api.pvp.net/api/lol/br/v1.3/game/by-summoner/4030160/recent?api_key=c85a3b8f-e5d7-4bd2-8416-f4f6950a3c61', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    body = (JSON.parse(body));
        	callback(null, body["games"], arg1);
		  }else{
		  	callback({error: error, response: response});
		  }
		});
    },
    function(arg1, arg2, callback) {
    	// --REDO
    	var db;
    	MongoClient.connect('mongodb://localhost:27017/lolfriender', function(err, connection){
    		console.log(err);
    		db = connection;
			callback(null, db, arg1, arg2);
    	});
    	// --
    },
    function(arg1, arg2, arg3, callback) {
        var fellowPlayers = "";
        each(arg2, function(value, cb){
        	each(value["fellowPlayers"], function(value2, cb2){
        		fellowPlayers += value2.summonerId+",";
	        	arg1.collection("lolfriender").insert({
	        		region: "br",
					date_finished: value.createDate,
	        		summoner: {
	        			summoner_id: arg3,
	        			champion_id: value.championId
	        		},
					fellowPlayer: {
						summoner_id: value2.summonerId,
	        			champion_id: value2.championId
					}
	        	}, function(err, inserted){
	        		//console.log(err, inserted);
	        		cb2(null);
	        	});
        	}, function(err){
				cb(null);
			});
        }, function(err){
			callback(null, arg1, arg3, fellowPlayers);
		});
    },
    function(arg1, arg2, arg3, callback){
    	request('https://br.api.pvp.net/api/lol/br/v2.5/league/by-summoner/'+arg2+'/entry?api_key=c85a3b8f-e5d7-4bd2-8416-f4f6950a3c61', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    body = (JSON.parse(body));

			arg1.collection("lolfriender").update(
			{
				"summoner.summoner_id": arg2
			},
			{
				$set:{
						"summoner.division": body[arg2][0]["entries"][0].division,
						"summoner.league": body[arg2][0].tier
				}
			},
			{
				multi: true
			}, function(err, updated){
				console.log(err);
        		callback(null, arg1, arg3);
			});

		  }else{
		  	callback({error: error, response: response});
		  }
		});
    },
    function(arg1, arg2, callback){
    	var arg2Array = arg2.split(",");
    	var times_to_repeat = parseInt(arg2Array.length/10);
    	console.log(times_to_repeat);
    	whilst(
		    function(){ return times_to_repeat > 0 },
		    function(cb){
	    		var only_ten = arg2Array.splice(0, 10);
	    		only_ten = only_ten.toString();
	    		if(only_ten != "" && only_ten != " "){
			    	request('https://br.api.pvp.net/api/lol/br/v2.5/league/by-summoner/'+only_ten+'/entry?api_key=c85a3b8f-e5d7-4bd2-8416-f4f6950a3c61', function (error, response, body) {
					  if (!error && response.statusCode == 200) {
					    body = (JSON.parse(body));
			        	only_ten = only_ten.split(",");
				    	each(only_ten, function(value, cb2){
				    		if(body[value] != undefined){
								arg1.collection("lolfriender").update(
								{
									"fellowPlayer.summoner_id": parseInt(value)
								},
								{
									$set:{
										"fellowPlayer.division": body[value][0]["entries"][0].division,
										"fellowPlayer.league": body[value][0].tier
									}
								},
								{
									multi: true
								}, function(err, updated){
									console.log(err);
					    			cb2(null);
								});
								console.log("b");
							}else{
								cb2(null);
							}
				    	}, function(err){
				    		times_to_repeat--;
				    		cb(null);
				    	});
					  }else{
					  	times_to_repeat--;
					  	cb({error: error, response: response});
					  }
					});
				}else{
					times_to_repeat--;
					cb(null);
				}		       	
		    }, function (err) {
		    	console.log("end it!");
		        callback(null);
		    }
		);
    }

], function (err, result) {
    // result now equals 'done'
});
