define(['dynamic-iframe', 'dynamic-iframe-host'], function(){
	'use strict';

	var exports = function(element, options) {
		this._element = element;
		this._options = options;

		// Delay after timeout.
		this.TIMEOUT_DELAY = 200;

		this._init();
	};

	exports.options = {
	};

	exports.prototype = {
		_init: function() {
			// Add listener to the PostMessage event that
			// the Medicinfo iframe sends on a new page.
			window.addEventListener("message", this._onMessage.bind(this), false);

			// Listen to the window resize event.
			window.addEventListener("resize", this._onResize.bind(this), false);

			// Register this iframe with the dyniframe
			// script to be resized to be without
			// scrollbars.
			siteIframes.register(this._element, 'Dynamic');
		},

		/**
		 * Handle event when the iframe sends a postMessage to
		 * the window element.
		 */
		_onMessage: function (event) {
			// Clear the old timeout.
			clearTimeout(this._messageTimeout);

			// Set the new timeout. The delay is necessary
			// to cut in the scroll to top action when
			// resizing is happening. The message event can
			// fire before the resize event, therefor
			// boolean switch method is not a viable
			// solution here.
			this._messageTimeout= setTimeout(this._onMessageEnd, this.TIMEOUT_DELAY);
		},

		/**
		 * This method is executed after the timeout delay set
		 * on the `_onMessage` event.
		 */
		_onMessageEnd: function() {
			scroll(0, 0);
		},

		/**
		 * When the window is resizing, clear the delay on the
		 * scroll to top event by the post message.
		 */
		_onResize: function(event) {
			// Clear the delay on the scroll to top event.
			// The scroll to top will not be fired during
			// the resizing.
			clearTimeout(this._messageTimeout);
		}

	};

	return exports;
});
