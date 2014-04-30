/**
 * Module for a scroll to top button which animates the document from its current scroll
 * position back to the top. It removes any existing links with #scroll-to-target as a target.
 *
 * Place the ID 'scroll-top-target' on the document for this module to work properly.
 *
 * See this article http://remysharp.com/2012/05/24/issues-with-position-fixed-scrolling-on-ios/
 * for the numerous problems with position: fixed on iOS.
 *
 * In order to fix bug 23963 the module had been given an extra option: useBodyElementInstead. This
 * option is on by default. It bypasses the intended behaviour of the module of scrolling to the element
 * with the id defined in scrollToTopTargetId and instead scrolls the page all the way to the top of the
 * body element. This ensures all content is visible on breakpoints XS~M.
 *
 * @see  {@link http://tfs.infra.local:8080/tfs/DefaultCollection/OnlineIntegratie/_workitems#_a=edit&id=23963|TFS}
 */
define(['ui/animated-scroll'], function(Scroller){
	'use strict';

	if (typeof Object.merge !== 'function') {
		Object.merge = function (o1, o2) { // Function to merge all of the properties from one object into another
			for(var i in o2) { o1[i] = o2[i]; }
			return o1;
		};
	}

	var exports = function(element, options) {
		this._element = element;
		this._options = Object.merge(exports.options, options);
		this._button = null;
		// See bug 23963
		if (this._options.useBodyElementInstead) {
			this._topTarget = document.getElementsByTagName('body')[0];
		} else {
			// Keep an easy reference to the element which has the scroll to top target ID
			this._topTarget =  document.getElementById(this._options.scrollToTopTargetId);
		}
		this._scroller = new Scroller();

		this._init();
	};

	exports.options = {
		scrollToTopTargetId: 'scroll-top-target',
		useBodyElementInstead: true
	};

	exports.prototype = {
		/**
		 * The click handler for the element which will initiate the scroll to top.
		 */
		_buttonClickHandler: function(event) {
			// Start the animation, as a starting point we will use the current position. We want to animate the
			// document to the position of the element which has the scroll to top target id, we can get the
			// distance between the current position and the top of the target element by getting its bounding
			// client rect and using its top property. This will be a negative value, the number of pixels we have
			// to scroll up to get to the target element
			this._scroller.startAnimation(this._scroller.getScrollPosition(), this._topTarget.getBoundingClientRect().top);

			// Prevent the default behaviour of the anchor element, otherwise IE8 will perform a nasty jump to the target
			// only to perform the scroll animation after that.
			if (event.preventDefault) {
				event.preventDefault();
			}
			return false;
		},

		/**
		 * Initializes our module, this is where we create the button which the user can use
		 * to scroll to the top. It also sets up event listeners for the button click and the
		 * scroll event of the window.
		 */
		_init: function() {
			// First we will remove all existing links to the top of the document, we need to do this
			// before we add our own link to the #scroll-top-target!
			this._removeScrollTopButtons();

			// Create the element which enables the user to scroll to the top
			var button = document.createElement('a');
			// Set the target of the link
			button.setAttribute('href', '#scroll-top-target');
			// Add the classes for the element to have it look like our scroll to top button
			// and hide it by default
			button.classList.add('scroll-to-top');
			button.classList.add('not-available');

			// Create the span with the text 'Naar boven', this text will only be visible on breakpoints bp-medium and above
			var span = document.createElement('span');
			this._setActionLabel(span, 'Naar boven');
			button.appendChild(span);

			// Add the element to the body
			document.body.appendChild(button);
			// Keep an easy reference to the element we've created
			this._button = button;

			// Add event listeners for the click on the button and for the window scroll
			this._button.addEventListener('click', this._buttonClickHandler.bind(this));
			window.addEventListener('scroll', this._scrollEventHandler.bind(this));
		},

		/**
		 * Removes all the anchor elements with #scroll-top-target as their destination.
		 */
		_removeScrollTopButtons: function() {
			// Get a list of all the anchor elements with #scroll-top-target as their destination
			var buttons = document.querySelectorAll('[href="#scroll-top-target"]');
			// Loop through all the buttons
			for (var index=0,ubound=buttons.length; index<ubound; index++) {
				// Remove the anchor element from the DOM
				buttons[index].parentNode.removeChild(buttons[index]);
			}
		},

		/**
		 * Handles the scroll event of the window, this is were we decide whether the scroll
		 * to top button should be visible.
		 */
		_scrollEventHandler: function(event) {
			var clientHeight = (document.documentElement || document.body).clientHeight;
			// Check if the user scrolled more than a the height of the viewport
			if (this._scroller.getScrollPosition() > clientHeight) {
				// The user scrolled more than the height of the viewport, we will make the
				// scroll to top button available
				this._button.classList.remove('not-available');
			} else {
				// The scroll position of the document is less than the height of the
				// viewport, we will hide the scroll to top button
				this._button.classList.add('not-available');
			}
		},

		/**
		 * Updates the content of the provided element to the new text
		 * @param  {HTMLElement} label The element whose content should be updated
		 * @param  {String} text  The new text which should be placed in the element
		 */
		_setActionLabel: function(label, text) {
			// Remove all the child elements within the provided element
			while(label.hasChildNodes()){
				label.removeChild(label.firstChild);
			}
			// Create a new text node with the provided text
			var textNode = document.createTextNode(text);
			// Place the text in the element
			label.appendChild(textNode);
		}
	};

	return exports;
});