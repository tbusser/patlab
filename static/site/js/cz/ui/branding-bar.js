define([], function($){
	'use strict';

	function addClass(element, className) {
		if (element.classList) {
			element.classList.add(className);
		}
		else {
			element.className += ' ' + className;
		}
	}

	function hasClass(element, className) {
		if (element.classList) {
			return element.classList.contains(className);
		}
		else {
			return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
		}
	}

	function removeClass(element, className) {
		if (element.classList) {
			element.classList.remove(className);
		}
		else {
			element.className = element.className.replace(new RegExp('(^| )' + className.split(' ').join('|') + '( |$)', 'gi'), ' ');
		}
	}

	var exports = function(element, options) {
		this._element = element;
		this._options = options;

		this._init();
	};

	exports.options = {

	};

	exports.prototype = {
		_init: function() {
			var that = this;

			this.searchForm = document.querySelector('.search');
			this.searchField = this.searchForm.querySelector('input[type=search]');
			this.searchButton = document.querySelector('.search > button[type=submit]');
			this.toggleSearch = document.querySelector('#toggle-search');
			this.logo = document.querySelector('.branding-bar .logo');

			// Highlight the search button when entering text in the search field.
			this.searchField.addEventListener('focus', that._onSearchFieldFocus.bind(this));
			this.searchField.addEventListener('blur', that._onSearchFieldBlur.bind(this));

			this.toggleSearch.addEventListener('click', that._onToggleSearchClick.bind(this));
		},

		/**
		 * Set the search button to the active state for extra attention.
		 */
		_onSearchFieldFocus: function(event) {
			this.searchButton.classList.add('active');
		},

		/**
		 * Reset the search button to the default state.
		 */
		_onSearchFieldBlur: function(event) {
			this.searchButton.classList.remove('active');

			// Check if there is user entered data. If so
			// leave the font color black.
			if (this.searchField.value.length !== 0) {
				this.searchField.classList.add('keep-focus');
			} else {
				this.searchField.classList.remove('keep-focus');
			}
		},

		/**
		 * Alternate between cross and looking glass on show and hide of the
		 * search field.
		 */
		_onToggleSearchClick: function(event) {
			var element = (event.currentTarget) ? event.currentTarget : event.srcElement;

			if (hasClass(element, 'hide')) {
				// Change the cross into the looking glass.
				removeClass(element, 'hide');

				// Show the search form.
				removeClass(this.searchForm, 'show');

				// Show the logo.
				removeClass(this.logo, 'hide');
			}
			else {
				// Change the looking glass into the cross.
				addClass(element, 'hide');

				// Show the search form.
				addClass(this.searchForm, 'show');

				// Hide the logo.
				addClass(this.logo, 'hide');
			}
		}
	};

	return exports;
});
