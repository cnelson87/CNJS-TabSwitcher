/*
	TITLE: TabSwitcher

	DESCRIPTION: standard tab switcher

	VERSION: 0.1.0

	USAGE: var myTabSwitcher = new TabSwitcher($('#el'), {options});
		@param {jQuery Object}
		@param {Object}

	AUTHORS: CN

	DEPENDENCIES:
		- jQuery 1.10+

*/

var TabSwitcher = function ($el, objOptions) {
	var self = this;

	// defaults
	this.$el = $el;
	this.options = $.extend({
		initialIndex: 0,
		selectorTabs: '.tabnav a',
		selectorPanels: '.tabpanels article',
		activeClass: 'active',
		animDuration: 400,
		animEasing: 'swing',
		customEventPrfx: 'CNJS:TabSwitcher'
    }, objOptions || {});

	// element references
	this.$elTabs = this.$el.find(this.options.selectorTabs);
	this.$elPanels = this.$el.find(this.options.selectorPanels);

	// setup & properties
	this._isInitialized = false;
	this._isAnimating = false;
	this._len = this.$elPanels.length;
	if (this.options.initialIndex >= this._len) {this.options.initialIndex = 0;}
	this.currentIndex = this.options.initialIndex;
	this.prevIndex = false;

	this._initialize();

    this._bindEvents();

};

TabSwitcher.prototype = {

/**
*	Private Methods
**/

	_initialize: function() {
		var self = this;
		var index = this.currentIndex;
		var $elActiveTab = $(this.$elTabs[index]);
		var $elActivePanel = $(this.$elPanels[index]);

		this.$elTabs.attr({'role':'tab'});
		this.$elPanels.attr({'role':'tabpanel', 'tabindex':'-1'}).hide();

		$elActiveTab.addClass(this.options.activeClass);
		$elActivePanel.addClass(this.options.activeClass).show();

		$.event.trigger(this.options.customEventPrfx + ':isInitialized', [this.elContainer]);

		this._isInitialized = true;

	},

	_bindEvents: function() {
		var self = this;

		this.$elTabs.on('click', function(e) {
			e.preventDefault();
			if (!self._isAnimating) {self.__clickTab(e);}
		});

	},


/**
*	Event Handlers
**/

	__clickTab: function(e) {
		var index = this.$elTabs.index(e.currentTarget);

		if (this.currentIndex === index) {
			this.$elPanels[index].focus();
		} else {
			this.prevIndex = this.currentIndex;
			this.currentIndex = index;
			this.switchPanels();
		}

	},


/**
*	Public Methods
**/

	switchPanels: function() {
		var self = this;
		var $elInactiveTab = $(this.$elTabs[this.prevIndex]);
		var $elInactivePanel = $(this.$elPanels[this.prevIndex]);
		var $elActiveTab = $(this.$elTabs[this.currentIndex]);
		var $elActivePanel = $(this.$elPanels[this.currentIndex]);

		this._isAnimating = true;

		//update tabs
		$elInactiveTab.removeClass(this.options.activeClass);
		$elActiveTab.addClass(this.options.activeClass);

		//update panels
		$elInactivePanel.removeClass(this.options.activeClass).hide();
		$elActivePanel.addClass(this.options.activeClass).fadeIn(this.options.animDuration, this.options.animEasing, function() {
			$elActivePanel.focus();
			self._isAnimating = false;
		});

		$.event.trigger(this.options.customEventPrfx + ':panelSwitched', [this.currentIndex]);

	}

};


//uncomment to use as a browserify module
//module.exports = TabSwitcher;
