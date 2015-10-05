/*
	TITLE: TabSwitcher

	DESCRIPTION: Basic TabSwitcher widget

	VERSION: 0.2.3

	USAGE: var myTabSwitcher = new TabSwitcher('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jQuery 2.1.4+
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
			customEventPrfx: 'CNJS:TabSwitcher'
		}, objOptions || {});

		// element references
		this.$tabs = this.$el.find(this.options.selectorTabs);
		this.$panels = this.$el.find(this.options.selectorPanels);

		// setup & properties
		this.isAnimating = false;
		this._len = this.$panels.length;
		if (this.options.initialIndex >= this._len) {this.options.initialIndex = 0;}
		this.currentIndex = this.options.initialIndex;
		this.prevIndex = false;
		this.heightEqualizer = null;

		// check url hash to override currentIndex
		this.focusOnInit = false;
		this.urlHash = window.location.hash.replace('#','') || false;
		if (this.urlHash) {
			for (var i=0; i<this._len; i++) {
				if (this.$panels[i].id === this.urlHash) {
					this.currentIndex = i;
					this.focusOnInit = true;
					break;
				}
			}
		}

		this.initDOM();

		this.bindEvents();

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var $activeTab = $(this.$tabs[this.currentIndex]);
		var $activePanel = $(this.$panels[this.currentIndex]);

		this.$el.attr({'role':'tablist'});
		this.$tabs.attr({'role':'tab'});
		this.$panels.attr({'role':'tabpanel', 'tabindex':'-1'});

		// equalize items height
		if (this.options.equalizeHeight) {
			this.heightEqualizer = new HeightEqualizer( this.$el, {
				selectorItems: this.options.selectorPanels,
				setParentHeight: false
			});
		}

		$activeTab.addClass(this.options.activeClass);
		$activePanel.addClass(this.options.activeClass);

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
			this.autoRotationCounter = this._len * this.options.maxAutoRotations;
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

		$.event.trigger(this.options.customEventPrfx + ':isInitialized', [this.$el]);

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
		this.prevIndex = this.currentIndex;
		this.currentIndex++;
		if (this.currentIndex === this._len) {this.currentIndex = 0;}

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
			this.prevIndex = this.currentIndex;
			this.currentIndex = index;
			this.switchPanels(event);
		}

	},


/**
*	Public Methods
**/

	switchPanels: function(event) {
		var self = this;
		var $inactiveTab = $(this.$tabs[this.prevIndex]);
		var $inactivePanel = $(this.$panels[this.prevIndex]);
		var $activeTab = $(this.$tabs[this.currentIndex]);
		var $activePanel = $(this.$panels[this.currentIndex]);

		this.isAnimating = true;

		//update tabs
		$inactiveTab.removeClass(this.options.activeClass);
		$activeTab.addClass(this.options.activeClass);

		//update panels
		$inactivePanel.removeClass(this.options.activeClass);
		$activePanel.addClass(this.options.activeClass);

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
					$activePanel.focus();
					self.focusOnPanel($activePanel);
				}
			}
		});

		$.event.trigger(this.options.customEventPrfx + ':panelOpened', [this.currentIndex]);

	},

	focusOnPanel: function($panel) {
		var scrollYPos = $panel.offset().top;
		var pnlHeight = $panel.outerHeight();
		var winHeight = this.$window.height();
		if (pnlHeight > winHeight) {
			this.$htmlBody.animate({scrollTop: scrollYPos}, 200, function(){
				$panel.focus();
			});
		} else {
			$panel.focus();
		}
	}

});

//uncomment to use as a browserify module
//module.exports = TabSwitcher;
