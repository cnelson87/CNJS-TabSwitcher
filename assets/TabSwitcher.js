/*
	TITLE: TabSwitcher

	DESCRIPTION: Basic TabSwitcher widget

	VERSION: 0.2.0

	USAGE: var myTabSwitcher = new TabSwitcher('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jQuery 2.1.4+
		- greensock
		- Class.js

*/

var TabSwitcher = Class.extend({
	init: function($el, objOptions) {

		// defaults
		this.$window = $(window);
		this.$el = $el;
		this.options = $.extend({
			initialIndex: 0,
			selectorTabs: '.tabnav a',
			selectorPanels: '.tabpanels > article',
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
		this.$elTabs = this.$el.find(this.options.selectorTabs);
		this.$elPanels = this.$el.find(this.options.selectorPanels);

		// setup & properties
		this.isAnimating = false;
		this._len = this.$elPanels.length;
		if (this.options.initialIndex >= this._len) {this.options.initialIndex = 0;}
		this.currentIndex = this.options.initialIndex;
		this.prevIndex = false;
		this.heightEqualizer = null;

		// check url hash to override currentIndex
		this.focusOnInit = false;
		this.urlHash = window.location.hash.replace('#','') || false;
		if (this.urlHash) {
			for (var i=0; i<this._len; i++) {
				if (this.$elPanels[i].id === this.urlHash) {
					this.currentIndex = i;
					this.focusOnInit = true;
					break;
				}
			}
		}

		this.initDOM();

		this.bindEvents();

		$.event.trigger(this.options.customEventPrfx + ':isInitialized', [this.$el]);

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var $elActiveTab = $(this.$elTabs[this.currentIndex]);
		var $elActivePanel = $(this.$elPanels[this.currentIndex]);

		this.$el.attr({'role':'tablist'});
		this.$elTabs.attr({'role':'tab'});
		this.$elPanels.attr({'role':'tabpanel', 'tabindex':'-1'});

		// equalize items height
		if (this.options.equalizeHeight) {
			this.heightEqualizer = new HeightEqualizer(this.$elPanels);
		}

		$elActiveTab.addClass(this.options.activeClass);
		$elActivePanel.addClass(this.options.activeClass);

		TweenMax.set(this.$elPanels, {
			display: 'none',
			opacity: 0
		});

		TweenMax.set($elActivePanel, {
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

		// focus on initial content
		if (this.focusOnInit) {
			$(window).load(function() {
				$('html, body').animate({scrollTop:0}, 1);
				$elActivePanel.focus();
			});
		}

	},

	bindEvents: function() {

		this.$elTabs.on('click', function(event) {
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
		var index = this.$elTabs.index(event.currentTarget);

		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

		if (this.currentIndex === index) {
			this.$elPanels[index].focus();
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
		var $elInactiveTab = $(this.$elTabs[this.prevIndex]);
		var $elInactivePanel = $(this.$elPanels[this.prevIndex]);
		var $elActiveTab = $(this.$elTabs[this.currentIndex]);
		var $elActivePanel = $(this.$elPanels[this.currentIndex]);

		this.isAnimating = true;

		//update tabs
		$elInactiveTab.removeClass(this.options.activeClass);
		$elActiveTab.addClass(this.options.activeClass);

		//update panels
		$elInactivePanel.removeClass(this.options.activeClass);
		$elActivePanel.addClass(this.options.activeClass);

		TweenMax.set($elInactivePanel, {
			display: 'none',
			opacity: 0
		});

		TweenMax.to($elActivePanel, this.options.animDuration, {
			display: 'block',
			opacity: 1,
			ease: self.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				if (!!event) {$elActivePanel.focus();}
			}
		});

		$.event.trigger(this.options.customEventPrfx + ':panelSwitched', [this.currentIndex]);

	}

});

//uncomment to use as a browserify module
//module.exports = TabSwitcher;
