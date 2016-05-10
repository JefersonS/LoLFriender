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


$(function(){
	var socket = io();

	socket.on('connect', function(s){

	});
	socket.on('searchReady', function(s){
		console.log(s);
	});

	$("#inProgress").hide();
	$("#findBtn").click(function(){
		var name = $("#name").val();
		var processId = new Date().getTime();

		if(name!=""){
			$("#inProgress").slideDown();
			$("#name").attr("disabled", "disabled");
			$("#findBtn").hide();


			$.get('/users/find', { proc: processId, name: name }, function(ret){
				$("#summomers").append("<div id='proc"+processId+">'<h4>"+name+"</h4><p>In progress...</p></div>");
			});

		}
	});
});