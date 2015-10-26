/*
	TITLE: TabSwitcher

	DESCRIPTION: Basic TabSwitcher widget

	VERSION: 0.2.6

	USAGE: var myTabSwitcher = new TabSwitcher('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jquery 2.1x+
		- greensock
		- Class.js
		- HeightEqualizer.js

*/

var TabSwitcher = Class.extend({
	init: function($el, objOptions) {

		// defaults
		this.$window = $(window);
		this.$htmlBody = $('html, body');
		this.$el = $el;
		this.options = $.extend({
			initialIndex: 0,
			selectorTabs: '.tabnav a',
			selectorPanels: '.tab-panel',
			activeClass: 'active',
			equalizeHeight: false,
			autoRotate: false,
			autoRotateInterval: 6000,
			maxAutoRotations: 5,
			animDuration: 0.2,
			animEasing: 'Power4.easeIn',
			selectorFocusEls: 'a, button, input, select, textarea',
			customEventName: 'CNJS:TabSwitcher'
		}, objOptions || {});

		// element references
		this.$tabs = this.$el.find(this.options.selectorTabs);
		this.$panels = this.$el.find(this.options.selectorPanels);

		// setup & properties
		this._length = this.$panels.length;
		if (this.options.initialIndex >= this._length) {this.options.initialIndex = 0;}
		this.currentIndex = this.options.initialIndex;
		this.previousIndex = null;
		this.heightEqualizer = null;
		this.isAnimating = false;

		// check url hash to override currentIndex
		this.focusOnInit = false;
		this.urlHash = window.location.hash.replace('#','') || false;
		if (this.urlHash) {
			for (var i=0; i<this._length; i++) {
				if (this.$panels[i].id === this.urlHash) {
					this.currentIndex = i;
					this.focusOnInit = true;
					break;
				}
			}
		}

		this.initDOM();

		this.bindEvents();

		$.event.trigger(this.options.customEventName + ':isInitialized', [this.$el]);

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var $activeTab = this.$tabs.eq(this.currentIndex);
		var $activePanel = this.$panels.eq(this.currentIndex);

		this.$el.attr({'role':'tablist', 'aria-live':'polite'});
		this.$tabs.attr({'role':'tab', 'tabindex':'0', 'aria-selected':'false'});
		this.$panels.attr({'role':'tabpanel', 'tabindex':'-1', 'aria-hidden':'true'});
		this.$panels.find(this.options.selectorFocusEls).attr({'tabindex':'-1'});

		// equalize items height
		if (this.options.equalizeHeight) {
			this.heightEqualizer = new HeightEqualizer( this.$el, {
				selectorItems: this.options.selectorPanels,
				setParentHeight: false
			});
		}

		$activeTab.addClass(this.options.activeClass).attr({'aria-selected':'true'});
		$activePanel.addClass(this.options.activeClass).attr({'tabindex':'0', 'aria-hidden':'false'});
		$activePanel.find(this.options.selectorFocusEls).attr({'tabindex':'0'});

		TweenMax.set(this.$panels, {
			display: 'none',
			opacity: 0
		});

		TweenMax.set($activePanel, {
			display: 'block',
			opacity: 1
		});

		// auto-rotate items
		if (this.options.autoRotate) {
			this.rotationInterval = this.options.autoRotateInterval;
			this.autoRotationCounter = this._length * this.options.maxAutoRotations;
			this.setAutoRotation = setInterval(function() {
				this.autoRotation();
			}.bind(this), this.rotationInterval);
		}

		// initial focus on content
		if (this.focusOnInit) {
			$(window).load(function() {
				this.$htmlBody.animate({scrollTop: 0}, 1);
				this.focusOnPanel($activePanel);
			}.bind(this));
		}

	},

	bindEvents: function() {

		this.$tabs.on('click', function(event) {
			event.preventDefault();
			if (!this.isAnimating) {
				this.__clickTab(event);
			}
		}.bind(this));

		this.$window.on('resize', function(event) {
			this.__onWindowResize(event);
		}.bind(this));

	},

	autoRotation: function() {
		this.previousIndex = this.currentIndex;
		this.currentIndex++;
		if (this.currentIndex === this._length) {this.currentIndex = 0;}

		this.switchPanels();
		this.autoRotationCounter--;

		if (this.autoRotationCounter === 0) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

	},


/**
*	Event Handlers
**/

	__onWindowResize: function(event) {
		if (this.options.equalizeHeight) {
			this.heightEqualizer.resetHeight();
		}
	},

	__clickTab: function(event) {
		var index = this.$tabs.index(event.currentTarget);

		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

		if (this.currentIndex === index) {
			this.$panels[index].focus();
		} else {
			this.previousIndex = this.currentIndex;
			this.currentIndex = index;
			this.switchPanels(event);
		}

	},


/**
*	Public Methods
**/

	switchPanels: function(event) {
		var self = this;
		var $inactiveTab = this.$tabs.eq(this.previousIndex);
		var $inactivePanel = this.$panels.eq(this.previousIndex);
		var $activeTab = this.$tabs.eq(this.currentIndex);
		var $activePanel = this.$panels.eq(this.currentIndex);

		this.isAnimating = true;

		//update tabs
		$inactiveTab.removeClass(this.options.activeClass).attr({'aria-selected':'false'});
		$activeTab.addClass(this.options.activeClass).attr({'aria-selected':'true'});

		//update panels
		$inactivePanel.removeClass(this.options.activeClass).attr({'tabindex':'-1', 'aria-hidden':'true'});
		$inactivePanel.find(this.options.selectorFocusEls).attr({'tabindex':'-1'});
		$activePanel.addClass(this.options.activeClass).attr({'tabindex':'0', 'aria-hidden':'false'});
		$activePanel.find(this.options.selectorFocusEls).attr({'tabindex':'0'});

		TweenMax.set($inactivePanel, {
			display: 'none',
			opacity: 0
		});

		TweenMax.to($activePanel, this.options.animDuration, {
			display: 'block',
			opacity: 1,
			ease: self.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				if (!!event) {
					self.focusOnPanel($activePanel);
				}
			}
		});

		$.event.trigger(this.options.customEventName + ':panelOpened', [this.currentIndex]);

	},

	focusOnPanel: function($panel) {
		var pnlTop = $panel.offset().top;
		var pnlHeight = $panel.outerHeight();
		var winTop = this.$window.scrollTop();
		var winHeight = this.$window.height();
		if (pnlHeight > winHeight || pnlTop < winTop) {
			this.$htmlBody.animate({scrollTop: pnlTop}, 200, function() {
				$panel.focus();
			});
		} else {
			$panel.focus();
		}
	}

});

//uncomment to use as a browserify module
//module.exports = TabSwitcher;
