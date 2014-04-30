define([], function(){
	'use strict';

	var exports = function(element, options) {
		this._element = element;
		this._options = options;

		this._init();
	};

	exports.options = {
		cookie: 'cookieBarShown=true'
	};

	exports.prototype = {
		_init: function() {
			this.cookieBar = document.querySelector('.cookie-bar');
			this.closeButton = document.querySelector('[data-role="close-button"]');
			this.closeButton.addEventListener('click', this._onCloseClick.bind(this));

			this._hasCookieBarBeenShown();
		},

		_hasCookie: function() {
			return document.cookie.indexOf(this._options.cookie) !== -1;
		},

		_setCookie: function() {
			var date = new Date();
			date.setTime(date.getTime() + 365*24*60*60*1000);
			document.cookie = this._options.cookie + ';' +
								'expires=' + date + ';' +
								'path=/;';
		},

		/**
		 * Close the cookie bar.
		 */
		_onCloseClick: function(event) {
			this._setCookieBarVisible(false);

			// Set the cookie so the cookie bar isn't shown again.
			this._setCookie();
		},

		/**
		 * Toggle the state of the cookie bar.
		 *
		 * state Boolean When `true` show the cookie bar.
		 */
		_setCookieBarVisible: function(state) {
			this.cookieBar.style.display = state ? 'block' : 'none';
		},

		/**
		 * Check if the cookie bar should be visible.
		 */
		_hasCookieBarBeenShown: function() {
			// Has the cookie bar been shown?
			if (this._hasCookie()) {
				return;
			}

			this._setCookieBarVisible(true);
		}
	};

	return exports;
});
