/**
 * This module animates the move of one vertical scroll position to another. For the animation it
 * uses a cubic ease out function.
 *
 * See this article http://www.kirupa.com/html5/animating_with_easing_functions_in_javascript.htm
 * for information on the easeOutCubic function that is used to scroll to the top of the window.
 */
define([], function(){
	'use strict';

	// Because of the numerous names of requestAnimationFrame we use this var to point to the
	// version that is available to us. When the browser doesn't have one of the known
	// requestAnimationFrame methods we will role our own fallback method with a setTimeout.
	var requestAnimationFrame = window.requestAnimationFrame ||
							window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame ||
							function (callback) {
								window.setTimeout(callback, 1000 / 60);
							};

	if (typeof Object.merge !== 'function') {
		Object.merge = function (o1, o2) { // Function to merge all of the properties from one object into another
			for(var i in o2) { o1[i] = o2[i]; }
			return o1;
		};
	}

	var exports = function(element, options) {
		this._element = element;
		this._options = Object.merge(exports.options, options);

		this._distance = 0;
		this._iteration = 0;
		this._startPosition = 0;
	};

	exports.options = {
		maxIterations: 50
	};

	exports.prototype = {
		/**
		 * This method is used to scroll a bit closer to the top of the window. As long as the top
		 * hasn't been reached the method will call itself at the next animation frame.
		 */
		_animationLoop: function() {
			var self = this;

			// Perform a step of the animation to go to the top of the window
			window.scrollTo(0, this._easeOutCubic(this._iteration, this._startPosition, this._distance, this._options.maxIterations));
			// Increase the iteration counter
			this._iteration++;

			// As long as we haven't gone through the max number of iterations we will have to schedule
			// the next part of the animation
			if (this._iteration <= this._options.maxIterations) {
				// We're not there yet, request a new animation frame to move a little closer to the top
				requestAnimationFrame(function() {
					self._animationLoop();
				});
			}
		},

		/**
		 * Robert Penner's algorithm for an cubic ease out function
		 * @param  {Number} currentIteration The current iteration of the animation, on each subsequent
		 *                                   call this should be increased by 1
		 * @param  {Number} startValue       The start value, this should be a constant throughout the
		 *                                   animation.
		 * @param  {Number} changeInValue    The difference between the start value and the desired end value
		 * @param  {Number} totalIterations  The number of iterations over which we want to go from start
		 *                                   to end
		 * @return {Number}                  The value for the current step in the animation
		 */
		_easeOutCubic: function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
		},

		/**
		 * Returns the height of the document in a cross browser safe way
		 * @return {Number} The height of the document in pixels
		 */
		_getDocumentHeight: function() {
			// There are quite a few variables that can return the height of the current document. This
			// method attempts to cover all the bases for a reliable end result
			var scrollHeight = (document.documentElement || document.body).scrollHeight,
				offsetHeight = (document.documentElement || document.body).offsetHeight,
				clientHeight = (document.documentElement || document.body).clientHeight;
			// Return whichever value is the highest
			return Math.max(scrollHeight, offsetHeight, clientHeight);
		},

		/**
		 * Returns the height of the viewport in a cross browser safe way
		 * @return {Number} The height of the viewport in pixels.
		 */
		_getViewportHeight: function() {
			return (document.documentElement || document.body).clientHeight;
		},

		/**
		 * Returns the scroll position of the document in a cross browser safe way.
		 *
		 * @return {Number} The current y position of the document.
		 */
		getScrollPosition: function() {
			return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
		},

		/**
		 * This method will start the animation. Before staring the animation it will check if it is possible to
		 * travel the requested distance. If the distance is too big it will correct the distance to the nearest
		 * possible distance.
		 *
		 * @param  {Number} startPosition The position from which we should start
		 * @param  {Number} distance      The number of pixels to move the document. A negative number will move
		 *                                the document closer to the top; a positive number will scroll further
		 *                                down
		 */
		startAnimation: function(startPosition, distance) {
			// The max position to scroll to is calculated by taking the height of the document and substracting the
			// height of the viewport. The result is the y position that is in view at the top of the screen when the
			// user has scrolled all the way to the bottom of the document
			var maxYPos = this._getDocumentHeight() - this._getViewportHeight();
			// The end position is the sum of the start position plus the distance
			var endPosition = startPosition + distance;

			// If the sum of the start position plus the distance is bigger than the maxYPos we've calculated than we need
			// to correct the distance as it is not possible to scroll beyond the y position of maxYPos
			if (endPosition > maxYPos) {
				// The distance is less than we though, we need to get the difference between the maxYPos and the current
				// position of the document
				distance = maxYPos - startPosition;
			} else if (endPosition < 0) {
				// We can't scroll beyond the top of the document, at the most we can scroll to the top of document
				distance = -startPosition;
			}

			// Remember the information passed along
			this._startPosition = startPosition;
			this._distance = distance;
			// Reset the iteration count
			this._iteration = 0;
			// Start the scroll animation
			this._animationLoop();
		}
	};

	return exports;
});
