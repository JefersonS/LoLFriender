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
	$scope.results = [{"name":"haiyk","data":[{"_id":{"id":"4030160","moment":"madrugada","league":"PLATINUM","division":"V"},"moment":42,"summoners":[{"id":"1071567","moment":"madrugada","league":"PLATINUM","division":"V"}]},{"_id":{"id":"4030160","moment":"noite","league":"PLATINUM","division":"V"},"moment":30,"summoners":[{"id":"1711331","moment":"noite","league":"PLATINUM","division":"III"},{"id":"632567","moment":"noite","league":"PLATINUM","division":"V"},{"id":"3997246","moment":"noite","league":"PLATINUM","division":"IV"},{"id":"402122","moment":"noite","league":"PLATINUM","division":"V"},{"id":"1786628","moment":"noite","league":"PLATINUM","division":"V"},{"id":"1169331","moment":"noite","league":"PLATINUM","division":"V"},{"id":"3511509","moment":"noite","league":"PLATINUM","division":"IV"}]},{"_id":{"id":"4030160","moment":"tarde","league":"PLATINUM","division":"V"},"moment":9,"summoners":[]}]}];

	var socket = io();
	socket.on('searchReady', function(s){
		$.get('/users/getFriends', s, function(data){
			$scope.$apply(function () {
				$scope.results.push({
					name: s.name,
					data: data
				});
			});
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