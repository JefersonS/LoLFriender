/*
	request id by name
		request matches by id
			fill mongo with each summoner
				for each summoner find their elo
					for each fellow player find their elo
						maybe find each one last matches, then count their recent roles and champions (not done)
				
 */	

var request = require('request');
var async = require("async");

var each = require("async/each");
var whilst = require("async/whilst");
var MongoClient = require("mongodb").MongoClient;
var Summoner = require('mongoose').model('Summoner');
var moment = require('moment');
config = require('../config/config');
var io = require('../lib/notification').getSocketIo();

/*var name = "";
var region = "";
var id = "";*/

const MAXIMUM_IDS_PER_REQUEST = 10;
const MADRUGADA = "00:00";
const MANHA = "05:00";
const DIA = "07:00";
const TARDE = "12:00";
const NOITE = "18:00";
const FIM_NOITE = "23:59";

module.exports = {
	index: function(req, res){
		res.render('find');
	},

	find: function(req, res){
		var name = req.query.name;
		var processId = req.query.processId;
		var region = req.query.region ;
		
		process_summoner(region, name, processId);		

		res.json({ success: true, 'summoner': name });

	},

	get_friends: function(req, res){
		console.log('opa');
		var name = req.query.name;
		var id = req.query.id;
		var region = req.query.region;

 		async.waterfall([
 			async.apply(find_time_and_elo, id),
 			async.apply(find_and_create_summoner_list, id),
 			async.apply(find_each_summoner_name, id, region)
 		], function(err, list_of_options){
 			res.send(list_of_options);
 		});
	},
}

/*
 * Waterfall for all the processes related to the summoner
 */

function process_summoner(region, name, processId){
		var summoner_id;
		async.waterfall([
			async.apply(find_id_by_name, region, name, processId),
			function(id, callback){
				summoner_id = id;
				callback(null, id);
			},
			async.apply(find_recent_games, region, name, processId),
			async.apply(save_summoner_fellow_player, region, name, processId),
			async.apply(find_insert_division_tier_summoner, region, name, processId),
			async.apply(find_insert_division_tier_fellows, region, name, processId)
		], function (err, summoner_id) {
			//console.log("End of process for summoner: " + name + " id: " + summoner_id);
			//request.post('https://9804b83f.ngrok.io/users/tell_summoner').form({name:name, id: summoner_id});
			//request.post('http://service.com/upload').form({key:'value'})
			console.log(err);
			io.emit("searchReady", { processId: processId, name: name, region: region, id: summoner_id });
		});		
	}

/*
 * Find summoner's ID by nane
 */

function find_id_by_name(region, name, processId, callback) {
	request('https://'+region+'.api.pvp.net/api/lol/'+region+'/v1.4/summoner/by-name/'+name+'?api_key='+config.key, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    body = (JSON.parse(body));
    	callback(null, body[name].id);
	  }else{
	  	callback({error: error, response: response});
	  }
	});
}

/*
 * Find recent games of summoner_id
 */

function find_recent_games(region, name, processId, summoner_id, callback) {
	request('https://'+region+'.api.pvp.net/api/lol/'+region+'/v1.3/game/by-summoner/'+summoner_id+'/recent?api_key='+config.key, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    body = (JSON.parse(body));
    	callback(null, body["games"], summoner_id);
	  }else{
	  	callback({error: error, response: response});
	  }
	});
}

/*
 * Create a registry for each fellow player with their champion id
 */

function save_summoner_fellow_player(region, name, processId, games, summoner_id, callback) {
    var fellowPlayers = "";

    each(games, function(value, each_callback){
    	each(value["fellowPlayers"], function(value2, each_callback2){
    		fellowPlayers += value2.summonerId+",";
    		var hour_played = moment(parseInt(value.createDate)).format("HH:mm").toString();
        	Summoner.update(
        	{
        		"summoner.summoner_id": summoner_id,
        		"fellowPlayer.summoner_id": value2.summonerId
        	},
        	{
        		region: region,
				date_finished: hour_played,
				moment: define_moment(hour_played),
        		summoner: {
        			summoner_id: summoner_id,
        			champion_id: value.championId
        		},
				fellowPlayer: {
					summoner_id: value2.summonerId,
        			champion_id: value2.championId
				}
        	},
        	{
        		upsert: true
        	}, function(err, inserted){
        		each_callback2(null);
        	});
    	}, function(err){
			each_callback(null);
		});
    }, function(err){
		callback(null, summoner_id, fellowPlayers);
	});
}

/*
 * Find and insert division and tier by summoner id
 */

function find_insert_division_tier_summoner(region, name, processId, summoner_id, fellowPlayers, callback){
	request('https://'+region+'.api.pvp.net/api/lol/'+region+'/v2.5/league/by-summoner/'+summoner_id+'/entry?api_key='+config.key, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    body = (JSON.parse(body));

		Summoner.update(
		{
			"summoner.summoner_id": summoner_id
		},
		{
			$set:{
					"summoner.division": body[summoner_id][0]["entries"][0].division,
					"summoner.league": body[summoner_id][0].tier
			}
		},
		{
			multi: true
		}, function(err, updated){
    		callback(null, fellowPlayers, summoner_id);
		});

	  }else{
	  	callback({error: error, response: response});
	  }
	});
}

/*
 * Find and insert division and tier by fellow player list of summoner id
 */

function find_insert_division_tier_fellows(region, name, processId, fellowPlayers, summoner_id, callback){
	var fellowPlayers_to_array = fellowPlayers.split(",");
	var times_to_repeat = parseInt(fellowPlayers_to_array.length/MAXIMUM_IDS_PER_REQUEST);

	whilst(
	    function(){ return times_to_repeat > 0 },
	    function(whilst_callback){
    		var fellowPlayers_list = fellowPlayers_to_array.splice(0, MAXIMUM_IDS_PER_REQUEST);
    		fellowPlayers_list = fellowPlayers_list.toString();
    		if(fellowPlayers_list != "" && fellowPlayers_list != " "){
		    	request('https://'+region+'.api.pvp.net/api/lol/'+region+'/v2.5/league/by-summoner/'+fellowPlayers_list+'/entry?api_key='+config.key, function (error, response, body) {
				  if (!error && response.statusCode == 200) {
				    body = (JSON.parse(body));
		        	fellowPlayers_list = fellowPlayers_list.split(",");
			    	each(fellowPlayers_list, function(value, each_callback){
			    		if(body[value] != undefined){
							Summoner.update(
							{
								"fellowPlayer.summoner_id": parseInt(value)
							},
							{
								$set:{
/*hadouken --)*/					"fellowPlayer.division": body[value][0]["entries"][0].division,
/*hadouken --)*/					"fellowPlayer.league": body[value][0].tier
								}
							},
							{
								multi: true
							}, function(err, updated){
				    			each_callback(null);
							});
						}else{
							each_callback(null);
						}
			    	}, function(err){
			    		times_to_repeat--;
			    		whilst_callback(null);
			    	});
				  }else{
				  	times_to_repeat--;
				  	whilst_callback({error: error, response: response});
				  }
				});
			}else{
				times_to_repeat--;
				whilst_callback(null);
			}		       	
	    }, function (err) {
	        callback(null, summoner_id);
	    }
	);
}

function find_time_and_elo(id, callback){
	Summoner.aggregate(
		[
			{
				$match:{
					"summoner.summoner_id" : id
				}
			},
			{
				$group:{
					_id:{
						id: "$summoner.summoner_id",
						moment: "$moment",
						league: "$summoner.league",
						division: "$summoner.division"
					},
					moment:{
						$sum: 1
					}
				}
			},
			{
				$sort:{
					moment: -1
				}
			},
			{
				$limit: 3
			}
		], function(err, summoner_info){

			callback(null, summoner_info);
		});
}

function find_and_create_summoner_list(id, summoner_info, callback){
	var summoners_ids = [];

	each(summoner_info, function(each_info, each_callback_1){
		each_info.summoners = [];

		Summoner.find(
			{$or:[
				{"summoner.summoner_id": id, "fellowPlayer.league": each_info._id.league, moment: each_info._id.moment}, // Won't look for divisions, once it's the same League, they're probably
				{"fellowPlayer.summoner_id": id, "summoner.league": each_info._id.league, moment: each_info._id.moment}  // able to play together (TODO: exception for Diamond players and higher)
			]},
			function(err, list){
				each(list, function(value, each_callback_2){
					if(value.summoner.summoner_id == id){
						summoners_ids.push(value.fellowPlayer.summoner_id);
						each_info.summoners.push({
							id: value.fellowPlayer.summoner_id,
							moment: value.moment,
							league: value.fellowPlayer.league,
							division: value.fellowPlayer.division
						});

						each_callback_2(null);
					}else{
						summoners_ids.push(value.summoner.summoner_id);
						each_info.summoners.push({
							id: value.summoner.summoner_id,
							moment: value.moment,
							tier: value.summoner.league,
							division: value.summoner.division
						});

						each_callback_2(null);
					}
				}, function(err){

					each_callback_1(null);
				});
			}
		);
	}, function(err){

		callback(null, summoner_info, summoners_ids);
	});
}

function find_each_summoner_name(id, region, summoner_info, summoners_ids, callback){
	
/*	request('https://'+region+'.api.pvp.net/api/lol/'+region+'/v1.4/summoner/'+summoners_ids.toString()+'?api_key='+config.key, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    body = (JSON.parse(body));
	    console.log(body);
    	callback(null, body["games"]);
	  }else{
	  	callback({error: error, response: response});
	  }
	});*/

	var times_to_repeat = parseInt(summoners_ids.length/MAXIMUM_IDS_PER_REQUEST);

	whilst(
	    function(){ return times_to_repeat > 0 },
	    function(whilst_callback){
    		var summoners_ids_spliced = summoners_ids.splice(0, MAXIMUM_IDS_PER_REQUEST);
    		summoners_ids_spliced = summoners_ids_spliced.toString();
    		if(summoners_ids_spliced != "" && summoners_ids_spliced != " "){
		    	request('https://'+region+'.api.pvp.net/api/lol/'+region+'/v1.4/summoner/'+summoners_ids_spliced+'?api_key='+config.key, function (error, response, body) {
				  if (!error && response.statusCode == 200) {
				    body = (JSON.parse(body));
		        	summoners_ids_spliced = summoners_ids_spliced.split(",");
			    	each(summoners_ids_spliced, function(value, each_callback_1){
			    		if(body[value] != undefined){
							each(summoner_info, function(each_info, each_callback_2){
								/*
								 * might be useful in some time
								 */
								each(each_info.summoners, function(info, each_callback_3){		// URGENT need of uderscore.js
									if(info.id == value){
/*hadouken --)*/						info.name = body[value].name;
									}
									
									each_callback_3(null);
								}, function(err){

									each_callback_2(null);
								});
							}, function(err){
								each_callback_1(null, summoner_info);
							});	
						}else{
							each_callback_1(null);
						}
			    	}, function(err){
			    		times_to_repeat--;
			    		whilst_callback(null);
			    	});
				  }else{
				  	times_to_repeat--;
				  	whilst_callback({error: error, response: response});
				  }
				});
			}else{
				times_to_repeat--;
				whilst_callback(null);
			}		       	
	    }, function (err) {
	        callback(null, summoner_info);
	    }
	);
}

function define_moment(value){
	if(value >= MADRUGADA && value < MANHA){ value = "madrugada"; }
	if(value >= MANHA && value < DIA){ value = "manha"; }
	if(value >= DIA && value < TARDE){ value = "dia"; }
	if(value >= TARDE && value < NOITE){ value = "tarde"; }
	if(value >= NOITE && value <= FIM_NOITE){ value = "noite"; }

	return value;
}