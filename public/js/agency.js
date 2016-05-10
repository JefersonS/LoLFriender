/*!
 * Start Bootstrap - Agency Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top'
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});


var app = angular.module('app', []);
app.controller('ResultsCtrl', ['$scope', function($scope){
	$scope.results = [];//[{"name":"haiyk","data":[{"_id":{"id":"4030160","moment":"madrugada","league":"PLATINUM","division":"V"},"moment":42,"summoners":[{"id":"1071567","moment":"madrugada","league":"PLATINUM","division":"V","name":"Drakerer","icon":661}]},{"_id":{"id":"4030160","moment":"noite","league":"PLATINUM","division":"V"},"moment":30,"summoners":[{"id":"1711331","moment":"noite","league":"PLATINUM","division":"III","name":"GG Daniel RxVrau","icon":546},{"id":"632567","moment":"noite","league":"PLATINUM","division":"V","name":"JoaoMartins","icon":579},{"id":"3997246","moment":"noite","league":"PLATINUM","division":"IV","name":"Meubonequinho","icon":592},{"id":"402122","moment":"noite","league":"PLATINUM","division":"V","name":"Jobulani","icon":519},{"id":"1786628","moment":"noite","league":"PLATINUM","division":"V","name":"iMrKite","icon":589},{"id":"1169331","moment":"noite","league":"PLATINUM","division":"V","name":"SAUDADES URF ","icon":502},{"id":"3511509","moment":"noite","league":"PLATINUM","division":"IV","name":"im captain julio","icon":12},{"id":"2612815","moment":"noite","league":"PLATINUM","division":"I","name":"FollowYourButt","icon":1133},{"id":"409368","moment":"noite","league":"PLATINUM","division":"II","name":"Clearly","icon":1151},{"id":"5063191","moment":"noite","league":"PLATINUM","division":"I","name":"Royalty Nordus","icon":1126},{"id":"3171958","moment":"noite","league":"PLATINUM","division":"V","name":"FollowYourHeart","icon":984},{"id":"436613","moment":"noite","league":"PLATINUM","division":"II","name":"JoseEputifari","icon":23}]},{"_id":{"id":"4030160","moment":"tarde","league":"PLATINUM","division":"V"},"moment":9,"summoners":[{"id":"1091979","moment":"tarde","league":"PLATINUM","division":"IV","name":"Vigh the Voight","icon":550},{"id":"1102279","moment":"tarde","league":"PLATINUM","division":"IV","name":"Look Sky Walked","icon":576},{"id":"1986225","moment":"tarde","league":"PLATINUM","division":"IV","name":"KradYsnetni","icon":712}]}]}];

	var socket = io();
	socket.on('searchReady', function(s){
		$.get('/users/getFriends', s, function(data){
			$scope.$apply(function () {
				$scope.results.push({
					name: s.name,
					data: data
				});
			});

			$("#inProgress").slideUp();
			$("#name").removeAttr("disabled");
			$("#findBtn").show();
		});
	});

	$("#inProgress").hide();
	$("#findBtn").click(function(){
		var name = $("#name").val();
		var region = $("#region").val();
		var processId = new Date().getTime();

		if(name!=""){
			$("#inProgress").slideDown();
			$("#name").attr("disabled", "disabled");
			$("#findBtn").hide();


			$.get('/users/find', { processId: processId, name: name, region: region}, function(ret){
			});

		}
	});
}]);