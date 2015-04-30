$( document ).ready(function(){
	$(".button-collapse").sideNav();

	$('.collapsible').collapsible();
	
	$('nav .container').velocity('transition.slideDownIn', { duration: 400 });
	
	$('.container.content').velocity('transition.slideUpIn', {duration: 600, delay: 600});
});

