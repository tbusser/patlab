define([], function(){
	'use strict';

	var exports = function(element, options) {
		this._element = document.querySelector('[data-stick-to-top]');
		this._options = options;


		this._bufferActive = false;
		this._elementYOffset = 0;
		this._isSticky = false;
		this._parent = null;
		this._resizeDelay = 500;
		this._sibling = null;

		this._init();
	};

	exports.options = {

	};

	exports.prototype = {
		_checkScrollPosition: function() {
			var windowOffset = this._getScrollPosition();

			// Check if the window is scrolled past the point where the element needs to become sticky
			if (windowOffset > this._elementYOffset) {
				// We should only make the element sticky when it has a position of absolute. It is a not so very nice
				// way of checking if the index is placed next to the sitemap or above it. Only when it is placed next
				// to the sitemap will the position be absolute
				var isAbsolute = (window.getComputedStyle(this._element).getPropertyValue('position') === 'absolute');
				// Make sure the element isn't sticky yet and it positioned absolute
				if (!this._isSticky && isAbsolute) {
					this._stickyOn();
					// Set the flag, the element is now sticky
					this._isSticky = true;
				}
			} else {
				// Make sure the element is sticky before we try to unstick it
				if (this._isSticky) {
					this._stickyOff();
					// Reset the sticky flag, the item is no longer sticky
					this._isSticky = false;
				}
			}
		},

		_getElementOffset: function(element) {
			var result = {left: 0, top: 0};
			while (element != null) {
				result.top += element.offsetTop;
				result.left += element.offsetLeft;
				element = element.offsetParent;
			}
			return result;
		},

		_getElementWidth: function(element) {
			var styles = window.getComputedStyle(element);

			return parseInt(styles.getPropertyValue('width'),10);
		},

		/**
		 * Returns the scroll position of the document in a cross browser safe way.
		 *
		 * @return {Number} The current y position of the document.
		 */
		_getScrollPosition: function() {
			return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
		},

		_init: function() {
			// We need to listen to the scroll event, this is were we can check if the element should be
			// sticky or not
			window.addEventListener('scroll', this._onScrollHandler.bind(this));
			window.addEventListener('resize', this._onResizeHandler.bind(this));
			// Get the y offset of the element, we need this value so we can check the window scroll position against the element's
			// original y offset and determine whether or not the element should be sticky
			this._elementYOffset = this._getElementOffset(this._element).top;
			// Get the parent node of the element, we will need this when we unstick the element
			this._parent = this._element.parentNode;
			// Get the next sibling node of the element, we will need this when we unstick the element
			this._sibling = this._element.nextSibling;
		},

		/**
		 * Log a message to console, with a timestamp, one that includes milliseconds, if wanted
		 * @param  {String}  message   The message to write to the console
		 * @param  {Boolean} timestamp True if a timestamp should be included; otherwise false
		 */
		_logMessage: function(message, timestamp) {
			if (timestamp) {
				// Get the current time
				var date = new Date();
				// Construct the timestamp, make sure the seconds and milliseconds always have respectively 2 or 3 characters
				message = date.getHours() + ':' + date.getMinutes() + ':' + ('0' + date.getSeconds()).slice(-2) + ':' + ('00' + date.getMilliseconds()).slice(-3) + ' - ' + message;
			}
			// Write the message to the console
			console.log(message);
		},

		_onResizeHandler: function() {
			// Check if we have a timeout set for handling the resize event
			if (this._resizeTimer != null) {
				// Clear the timeout
				clearInterval(this._resizeTimer);
				this._resizeTimer = null;
			}
			var self = this;
			// Setup a new timeout for checking which images need replacing
			this._resizeTimer = setTimeout(function() {
				self._updateSitemapIndex();
			}, this._resizeDelay);
		},

		/**
		 * Handles the scroll event of the window, this is where we can check if the element should be sticky or not
		 * @return {event} The scroll event we need to handle
		 */
		_onScrollHandler: function() {
			// Check if the scroll event buffer is active or no
			if (!this._bufferActive) {
				// The buffer wasn't yet active, we will active it now
				this._bufferActive = true;
				var self = this;
				// Set a time out of 125ms, as long as this time out is active all subsequent scroll events will be ignored. We do this
				// because if we react to each and every scroll event the user experience will suffer, especially on devices with a less
				// powerful CPU. Now we lump a bunch of them together and 1/8 of a second is stil more than often enough
				window.setTimeout(function() {
					// Reset the buffer flag, the next received scroll event will once again trigger the time out
					self._bufferActive = false;
					// Check the scroll position to see if the element should (un)stick itself
					self._checkScrollPosition();
				}, 125);
			}
		},

		_stickyOff: function() {
			// Remove the style attribute, this will remove the left positioning
			this._element.removeAttribute('style');
			// Move the element back to its original place in the DOM, to do this we need to insert it back into its
			// original parent and insert the element before its original next sibling
			this._parent.insertBefore(this._element, this._sibling);
			// Remove the sticky class
			this._element.classList.remove('sticky');
		},

		_stickyOn: function() {
			// We need to set the left attribute due to the fact that position:fixed isn't relative to the viewport for our website.
			// This is something that we probably should look into, I suspect MM Menu is to blame for this. Anyway, we need to get
			// to current left offset of the element so we can make this an inline style. Then we also need to set the width since this
			// is specified in percentages and we're chaning the parent container. If we don't do this the width of the element will
			// change once it becomes fixed
			this._element.setAttribute('style', 'left:' + this._getElementOffset(this._element).left + 'px;width:' + this._getElementWidth(this._element) + 'px;');
			// Move the sticky element from it's current parent to the body
			this._element = document.body.appendChild(this._element);
			// Add the sticky class
			this._element.classList.add('sticky');
		},

		_updateSitemapIndex: function() {
			if (this._isSticky) {
				this._stickyOff();
				this._stickyOn();
			}
		}
	};

	return exports;
});