/**
 * This module is when there is an alphabet list on the page. It listens to the click event on one of the
 * letters in the list and uses an animation to scroll to the href target of the clicked element.
 *
 * @param  {Object} Scroller This module requires the animated-scroll module to perform the scroll animation.
 */
define(['ui/animated-scroll'], function(Scroller){
	'use strict';

	var exports = function(element, options) {
		this._element = element;
		this._options = options;
		this._scroller = new Scroller();

		this._init();
	};

	exports.options = {

	};

	exports.prototype = {
		/**
		 * This method attaches a click handler to all the anchor elements in the alphabet list
		 */
		_attachIndexEventListeners: function() {
			// Get all the anchor elements in the alphabet list
			var links = document.querySelectorAll('[data-scroll-to-target] a');
			// Iterate over all the anchor elements
			for(var index=0,ubound=links.length; index<ubound; index++) {
				// Attach an event listener to the anchor element for the click event
				links[index].addEventListener('click', this._indexClickHandler.bind(this));
			}
		},

		/**
		 * Handles the event which is fired when the user clicks on one of the letters in the alphabet list
		 */
		_indexClickHandler: function(event) {
			var correction = 0;
			// Get the target, this is the link the user has clicked on
			var target = (event.currentTarget) ? event.currentTarget : event.srcElement;
			if (target == null) {
				return;
			}

			// Get the element the link referes to and make sure the link target exists before we continue
			var hrefTarget = document.querySelector(target.getAttribute('href'));
			if (hrefTarget == null) {
				return;
			}

			// Get the header element which is used to show the menu bar
			var header = document.querySelector('header.mm-fixed-top');
			// Make sure we got the header before we continue querying it
			if (header != null) {
				// Get the computed styles for the header element
				var style = window.getComputedStyle(header, null);
				// If the header has a position of fixed we need to correct the desired scroll position
				if (style.position === 'fixed') {
					correction = -header.offsetHeight;
				}
			}
			// Start the animation, as a starting point we will use the current position. We want to animate the
			// document to the position of the element which is the target of the anchor, we can get the
			// distance between the current position and the top of the target element by getting its bounding
			// client rect and using its top property. This will be a positive value, the number of pixels we have
			// to scroll down to get to the target element.
			//
			// Correct the destination of the scroll target. This will ensure the desired element is shown just after
			// the fixed menu bar instead of underneath it.
			this._scroller.startAnimation(this._scroller.getScrollPosition(), (hrefTarget.getBoundingClientRect().top + correction));

			event.preventDefault();
		},

		/**
		 * Initializes the module by attaching event listeners to the links of the index letters.
		 */
		_init: function() {
			this._attachIndexEventListeners();
		}
	};

	return exports;
});
