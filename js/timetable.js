jQuery(document).ready(function($){
	var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
	var transitionsSupported = ( $('.csstransitions').length > 0 );
	//if browser does not support transitions - use a different artist to trigger them
   if( !transitionsSupported ) transitionEnd = 'noTransition';
	
	//should add a loding while the artists are organized 

	function SchedulePlan( element ) {
		this.element = element;
		this.timeline = this.element.find('.timeline');
		this.timelineItems = this.timeline.find('li');
		this.timelineItemsNumber = this.timelineItems.length;
		this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
		//need to store delta (in our case half hour) timestamp
		this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());

		this.artistsWrapper = this.element.find('.artists');
		this.artistsGroup = this.artistsWrapper.find('.artists-group');
		this.singleartists = this.artistsGroup.find('.single-artist');
		this.artistslotHeight = this.artistsGroup.eq(0).children('.top-info').outerHeight();

		this.modal = this.element.find('.artist-modal');
		this.modalHeader = this.modal.find('.header');
		this.modalHeaderBg = this.modal.find('.header-bg');
		this.modalBody = this.modal.find('.body'); 
		this.modalBodyBg = this.modal.find('.body-bg'); 
		this.modalMaxWidth = 800;
		this.modalMaxHeight = 480;

		this.animating = false;

		this.initSchedule();
	}

	SchedulePlan.prototype.initSchedule = function() {
		this.scheduleReset();
		this.initartists();
	};

	SchedulePlan.prototype.scheduleReset = function() {
		var mq = this.mq();
		if( mq == 'desktop' && !this.element.hasClass('js-full') ) {
			//in this case you are on a desktop version (first load or resize from mobile)
			this.artistslotHeight = this.artistsGroup.eq(0).children('.top-info').outerHeight();
			this.element.addClass('js-full');
			this.placeartists();
			this.element.hasClass('modal-is-open') && this.checkartistModal();
		} else if(  mq == 'mobile' && this.element.hasClass('js-full') ) {
			//in this case you are on a mobile version (first load or resize from desktop)
			this.element.removeClass('js-full loading');
			this.artistsGroup.children('ul').add(this.singleartists).removeAttr('style');
			this.artistsWrapper.children('.grid-line').remove();
			this.element.hasClass('modal-is-open') && this.checkartistModal();
		} else if( mq == 'desktop' && this.element.hasClass('modal-is-open')){
			//on a mobile version with modal open - need to resize/move modal window
			this.checkartistModal('desktop');
			this.element.removeClass('loading');
		} else {
			this.element.removeClass('loading');
		}
	};

	SchedulePlan.prototype.initartists = function() {
		var self = this;

		this.singleartists.each(function(){
			//create the .artist-date element for each artist
			var durationLabel = '<span class="artist-date">'+$(this).data('start')+' - '+$(this).data('end')+'</span>';
			$(this).children('a').prepend($(durationLabel));

			//detect click on the artist and open the modal
			$(this).on('click', 'a', function(artist){
				artist.prartistDefault();
				if( !self.animating ) self.openModal($(this));
			});
		});

		//close modal window
		this.modal.on('click', '.close', function(artist){
			artist.prartistDefault();
			if( !self.animating ) self.closeModal(self.artistsGroup.find('.selected-artist'));
		});
		this.element.on('click', '.cover-layer', function(artist){
			if( !self.animating && self.element.hasClass('modal-is-open') ) self.closeModal(self.artistsGroup.find('.selected-artist'));
		});
	};

	SchedulePlan.prototype.placeartists = function() {
		var self = this;
		this.singleartists.each(function(){
			//place each artist in the grid -> need to set top position and height
			var start = getScheduleTimestamp($(this).attr('data-start')),
				duration = getScheduleTimestamp($(this).attr('data-end')) - start;

			var artistTop = self.artistslotHeight*(start - self.timelineStart)/self.timelineUnitDuration,
				artistHeight = self.artistslotHeight*duration/self.timelineUnitDuration;
			
			$(this).css({
				top: (artistTop -1) +'px',
				height: (artistHeight+1)+'px'
			});
		});

		this.element.removeClass('loading');
	};

	SchedulePlan.prototype.openModal = function(artist) {
		var self = this;
		var mq = self.mq();
		this.animating = true;

		//update artist name and time
		this.modalHeader.find('.artist-name').text(artist.find('.artist-name').text());
		this.modalHeader.find('.artist-date').text(artist.find('.artist-date').text());
		this.modal.attr('data-artist', artist.parent().attr('data-artist'));

		//update artist content
		this.modalBody.find('.artist-info').load(artist.parent().attr('data-content')+'.html .artist-info > *', function(data){
			//once the artist content has been loaded
			self.element.addClass('content-loaded');
		});

		this.element.addClass('modal-is-open');

		setTimeout(function(){
			//fixes a flash when an artist is selected - desktop version only
			artist.parent('li').addClass('selected-artist');
		}, 10);

		if( mq == 'mobile' ) {
			self.modal.one(transitionEnd, function(){
				self.modal.off(transitionEnd);
				self.animating = false;
			});
		} else {
			var artistTop = artist.offset().top - $(window).scrollTop(),
				artistLeft = artist.offset().left,
				artistHeight = artist.innerHeight(),
				artistWidth = artist.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
				modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

			var modalTranslateX = parseInt((windowWidth - modalWidth)/2 - artistLeft),
				modalTranslateY = parseInt((windowHeight - modalHeight)/2 - artistTop);
			
			var HeaderBgScaleY = modalHeight/artistHeight,
				BodyBgScaleX = (modalWidth - artistWidth);

			//change modal height/width and translate it
			self.modal.css({
				top: artistTop+'px',
				left: artistLeft+'px',
				height: modalHeight+'px',
				width: modalWidth+'px',
			});
			transformElement(self.modal, 'translateY('+modalTranslateY+'px) translateX('+modalTranslateX+'px)');

			//set modalHeader width
			self.modalHeader.css({
				width: artistWidth+'px',
			});
			//set modalBody left margin
			self.modalBody.css({
				marginLeft: artistWidth+'px',
			});

			//change modalBodyBg height/width ans scale it
			self.modalBodyBg.css({
				height: artistHeight+'px',
				width: '1px',
			});
			transformElement(self.modalBodyBg, 'scaleY('+HeaderBgScaleY+') scaleX('+BodyBgScaleX+')');

			//change modal modalHeaderBg height/width and scale it
			self.modalHeaderBg.css({
				height: artistHeight+'px',
				width: artistWidth+'px',
			});
			transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
			
			self.modalHeaderBg.one(transitionEnd, function(){
				//wait for the  end of the modalHeaderBg transformation and show the modal content
				self.modalHeaderBg.off(transitionEnd);
				self.animating = false;
				self.element.addClass('animation-completed');
			});
		}

		//if browser do not support transitions -> no need to wait for the end of it
		if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
	};

	SchedulePlan.prototype.closeModal = function(artist) {
		var self = this;
		var mq = self.mq();

		this.animating = true;

		if( mq == 'mobile' ) {
			this.element.removeClass('modal-is-open');
			this.modal.one(transitionEnd, function(){
				self.modal.off(transitionEnd);
				self.animating = false;
				self.element.removeClass('content-loaded');
				artist.removeClass('selected-artist');
			});
		} else {
			var artistTop = artist.offset().top - $(window).scrollTop(),
				artistLeft = artist.offset().left,
				artistHeight = artist.innerHeight(),
				artistWidth = artist.innerWidth();

			var modalTop = Number(self.modal.css('top').replace('px', '')),
				modalLeft = Number(self.modal.css('left').replace('px', ''));

			var modalTranslateX = artistLeft - modalLeft,
				modalTranslateY = artistTop - modalTop;

			self.element.removeClass('animation-completed modal-is-open');

			//change modal width/height and translate it
			this.modal.css({
				width: artistWidth+'px',
				height: artistHeight+'px'
			});
			transformElement(self.modal, 'translateX('+modalTranslateX+'px) translateY('+modalTranslateY+'px)');
			
			//scale down modalBodyBg element
			transformElement(self.modalBodyBg, 'scaleX(0) scaleY(1)');
			//scale down modalHeaderBg element
			transformElement(self.modalHeaderBg, 'scaleY(1)');

			this.modalHeaderBg.one(transitionEnd, function(){
				//wait for the  end of the modalHeaderBg transformation and reset modal style
				self.modalHeaderBg.off(transitionEnd);
				self.modal.addClass('no-transition');
				setTimeout(function(){
					self.modal.add(self.modalHeader).add(self.modalBody).add(self.modalHeaderBg).add(self.modalBodyBg).attr('style', '');
				}, 10);
				setTimeout(function(){
					self.modal.removeClass('no-transition');
				}, 20);

				self.animating = false;
				self.element.removeClass('content-loaded');
				artist.removeClass('selected-artist');
			});
		}

		//browser do not support transitions -> no need to wait for the end of it
		if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
	}

	SchedulePlan.prototype.mq = function(){
		//get MQ value ('desktop' or 'mobile') 
		var self = this;
		return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
	};

	SchedulePlan.prototype.checkartistModal = function(device) {
		this.animating = true;
		var self = this;
		var mq = this.mq();

		if( mq == 'mobile' ) {
			//reset modal style on mobile
			self.modal.add(self.modalHeader).add(self.modalHeaderBg).add(self.modalBody).add(self.modalBodyBg).attr('style', '');
			self.modal.removeClass('no-transition');	
			self.animating = false;	
		} else if( mq == 'desktop' && self.element.hasClass('modal-is-open') ) {
			self.modal.addClass('no-transition');
			self.element.addClass('animation-completed');
			var artist = self.artistsGroup.find('.selected-artist');

			var artistTop = artist.offset().top - $(window).scrollTop(),
				artistLeft = artist.offset().left,
				artistHeight = artist.innerHeight(),
				artistWidth = artist.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
				modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

			var HeaderBgScaleY = modalHeight/artistHeight,
				BodyBgScaleX = (modalWidth - artistWidth);

			setTimeout(function(){
				self.modal.css({
					width: modalWidth+'px',
					height: modalHeight+'px',
					top: (windowHeight/2 - modalHeight/2)+'px',
					left: (windowWidth/2 - modalWidth/2)+'px',
				});
				transformElement(self.modal, 'translateY(0) translateX(0)');
				//change modal modalBodyBg height/width
				self.modalBodyBg.css({
					height: modalHeight+'px',
					width: '1px',
				});
				transformElement(self.modalBodyBg, 'scaleX('+BodyBgScaleX+')');
				//set modalHeader width
				self.modalHeader.css({
					width: artistWidth+'px',
				});
				//set modalBody left margin
				self.modalBody.css({
					marginLeft: artistWidth+'px',
				});
				//change modal modalHeaderBg height/width and scale it
				self.modalHeaderBg.css({
					height: artistHeight+'px',
					width: artistWidth+'px',
				});
				transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
			}, 10);

			setTimeout(function(){
				self.modal.removeClass('no-transition');
				self.animating = false;	
			}, 20);
		}
	};

	var schedules = $('.cd-schedule');
	var objSchedulesPlan = [],
		windowResize = false;
	
	if( schedules.length > 0 ) {
		schedules.each(function(){
			//create SchedulePlan objects
			objSchedulesPlan.push(new SchedulePlan($(this)));
		});
	}

	$(window).on('resize', function(){
		if( !windowResize ) {
			windowResize = true;
			(!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
		}
	});

	$(window).keyup(function(artist) {
		if (artist.keyCode == 27) {
			objSchedulesPlan.forEach(function(element){
				element.closeModal(element.artistsGroup.find('.selected-artist'));
			});
		}
	});

	function checkResize(){
		objSchedulesPlan.forEach(function(element){
			element.scheduleReset();
		});
		windowResize = false;
	}

	function getScheduleTimestamp(time) {
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g,'');
		var timeArray = time.split(':');
		var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
		return timeStamp;
	}

	function transformElement(element, value) {
		element.css({
		    '-moz-transform': value,
		    '-webkit-transform': value,
			'-ms-transform': value,
			'-o-transform': value,
			'transform': value
		});
	}
});