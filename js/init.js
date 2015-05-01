$(document).ready(function(){
	$(".button-collapse").sideNav();

	$('.collapsible').collapsible();
	
	$('.navbar-fixed .container').velocity('transition.slideDownIn', { duration: 400 });
	
	$('.container.content').velocity('transition.slideUpIn', { duration: 600, delay: 600 });
});

$(window).bind('beforeunload', function(){

});
