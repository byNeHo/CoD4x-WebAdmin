var socket = io.connect('/');
$(function(){
	
	//Notifications
	var $notificationForm = $('.notificationForm');
	var $notifymessage = $('.notifymessage');
	var $socketid = $('.socketid');
	var $notifyurl = $('.notifyurl');
	//Private Notifications
	var $notificationprivateForm = $('.notificationprivateForm');
	//Shoutbox
	var $messageForm = $('#messageForm');
	var $message = $('#message');
	var $shoutbox = $('#shoutbox');

	var $todayusers = $('#todayusers');
	var $serverjoins = $('#serverjoins');
	var firstTime = true;

	

	socket.on('online servers', function(serverjoins){
		$('#serverjoins').empty().append('');
		serverjoins.forEach(function (getserver) {
			Displayservers(getserver);
		});
		
	});

	
	socket.on('today users', function(todayusers){
		$('#todayusers').empty().append('');
		$todayusers.append('<strong>Todays Visitors: </strong>');
		todayusers.forEach(function (userstoday) {
			getUsersToday(userstoday);
			//console.log('Today: '+userstoday._id)
		});
		
	});


	// Typing
	socket.on('updateTyping', function(me, isTyping) {
		if (isTyping === true) {
			$('#typing').html(me + ' is typing...');
		} else {
			$('#typing').html('');
		}
	});
		$('#message').keyup(function(e) {
		if (e.which === 13) {
			socket.emit('typing', false);
		} else if ($('#message').val() !== '') {
			socket.emit('typing', true);
		} else {
			socket.emit('typing', false);
		}
	});


	//Shoutbox
	$messageForm.submit(function(e){
		e.preventDefault();
		socket.emit('send message', $message.val());
		$message.val('');
	});

	$notificationForm.submit(function(){
		socket.emit('send notification', $notifymessage.val());
		$notifymessage.val('');
	});

	//Private Notification
	$notificationprivateForm.submit(function(){
		socket.emit('send notification private', $socketmember.val());
		$socketmember.val('');
	});
	
	socket.on('new message', function(data){
		$(function () {
			DisplayShouts(data);
		});
	});

	socket.on('new notify message', function(data, message, type, url){
		$(function () {
			notify(data);
		});
	});
	
	
	function Displayservers(docs){
		$serverjoins.append('<a class="list-group-item media" href="cod4://'+docs.ip+':'+docs.port+'"><div class="pull-left p-relative"><img class="lgi-img" src="/img/maps/'+docs.map_img+'.jpg" alt="'+docs.map_playing+'"></div><div class="media-body"><div class="lgi-heading">'+docs.name+'</div>Players: '+docs.online_players+'</div></a>');
	}

	function getUsersToday(docs){
		$todayusers.append('<li><a href="/members/'+docs._id+'">'+docs.local.user_name+'</a></li>');
	}


    function DisplayShouts(docs){
		var msgtime = Date.now();
		var md = window.markdownit(({
				html: false,
				linkify: true,
				typographer: false
		}));
		var result = md.render(docs.msg);
		$shoutbox.append('<div class="mblm-item mblm-item-left"><a class="pull-left m-r-15" href="'+docs.profile_link+'"><img class="lgi-img" src="'+docs.avatar+'" alt="avatar"></a><div><strong>'+docs.user+'</strong><span class="small p-l-10 c-gray">'+moment(message.createdAt).fromNow()+'</span><span>'+result+'</span></div></div>');
		scrollToBottom();
	}

	function notify(docs, from, align, icon, type, animIn, animOut){$.growl({icon: icon, title: docs.user, message: docs.mynotification, url:'#'},{element: 'body',type: docs.notificationtype, allow_dismiss: false,placement: {from: 'bottom',align: 'right'},offset: {x: 15,y: 15},spacing:15,z_index: 1031,delay: 9500,timer: 1000,url_target: '_self',mouse_over: false,animate: {enter: 'animated fadeInRight',exit: 'animated fadeOutRight'},icon_type: 'class',template: '<div data-growl="container" class="alert" role="alert">' +'<button type="button" class="close" data-growl="dismiss">' +'<span aria-hidden="true">&times;</span>' +'<span class="sr-only">Close</span>' +'</button>' +'<div data-growl="icon"><img class="lgi-img pull-left m-r-15" src="'+docs.avatar+'" alt="avatar"></div><div clas="pull-left"><span class="notification-title" data-growl="title"></span> - <span data-growl="message"></span><a href="#" data-growl="url"></a></div></div>'});};

	function scrollToBottom() {
		$("#shoutbox").animate({ scrollTop: $('#shoutbox')[0].scrollHeight}, "fast");
	}

	

});

	