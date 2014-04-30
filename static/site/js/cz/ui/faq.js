define(['jquery'], function($){
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
		this._initialized = false;

		this._init();
	};

	exports.options = {
		labelOpenState: 'Verberg het antwoord van de veelgestelde vraag ',
		labelCloseState: 'Toon de veelgestelde vraag '
	};

	exports.prototype = {
		/**
		 * The solution for collapsing / expanding the faq item requires the content of the faq item to be
		 * wrapped within an extra div element. We don't want this div element to be there initially as it
		 * serves no purpose when JavaScript is not available, so we will add it now.
		 *
		 * @param  {HTMLElement} element The element with the faq class applied to it
		 */
		_addInnerContainer: function(element) {
			// Get the container with the faq answer and make sure we found it before we continue
			var faqContent = element.querySelector('.faq-content');
			if (faqContent == null) {
				return;
			}

			// Create the new inner div element that we need for the animation to run well
			var inner = document.createElement('div');
			inner.classList.add('inner');
			// Loop throught the elements in faqContent and move them over to the new div element
			while(faqContent.hasChildNodes()) {
				inner.appendChild(faqContent.firstChild);
			}
			// Add the new container as a child to the container which holds the faq answer
			faqContent.appendChild(inner);
		},

		/**
		 * In order to allow the user to collapse / expand our FAQ item we will add a button element in the heading element
		 * which is already present. The reason we add a button in the heading is because the button element can receive
		 * keyboard focus and it shows up in a list of interactive elements for screen readers.
		 *
		 * @param  {HTMLElement} element The element with the faq class applied to it
		 */
		_addToggleButton: function(element) {
			// Get the header of the faq item and make sure we found it before we continue
			var heading = element.querySelector('h3');
			if (heading == null) {
				return;
			}

			// Create the button we need for the user interaction and the span to add some hidden text
			var button = document.createElement('button'),
				span = document.createElement('span');
			// Apply the class visuallyhidden to hide the text in the label from sighted users, we just want the text
			// in the label to be used by screen readers
			span.classList.add('visuallyhidden');
			// Set the data-role attribute for the label so we can easily find it later on
			span.setAttribute('data-role', 'action-label');
			// The button isn't a submit button, we should alter its type
			button.setAttribute('type', 'button');
			// Add the span the the button
			button.appendChild(span);

			// Move all elements from the heading element to the button
			while (heading.hasChildNodes()) {
				// Appending the firstChild to the button will cause it to be removed from the heading child list
				button.appendChild(heading.firstChild);
			}
			// Remove the title class from the heading and apply it to the button, this is now our visible title
			heading.classList.remove('title');
			button.classList.add('title');
			// Add the button we've created to the heading element
			heading.appendChild(button);
		},

		/**
		 * Traverses the parent nodes of the element until it finds an element with the class faq or it reaches
		 * the top most element
		 * @param  {HTMLElement} element The starting point for the search for the faq container
		 * @return {[type]}              Null if no element with the class faq has been found in any of the parent nodes;
		 *                               otherwise it returns the closest element with the faq class
		 */
		_findFaqItemForElement: function(element) {
			var result = null;
			// Check if the element itself doesn't have the faq class
			if (element.classList.contains('faq')) {
				// The element is already a faq container, return the input as the result of the method
				return element;
			}
			// Keep checking as long as there are parent nodes and we don't have a result yet
			while (element.parentNode != null && result == null) {
				// Check if the parent node has the faq class
				if (element.parentNode.classList.contains('faq')) {
					// We've found our faq container, this will be the result of the method
					result = element.parentNode;
				} else {
					// No faq container yet, let's go up one level
					element = element.parentNode;
				}
			}
			// Return the result
			return result;
		},

		/**
		 * Intializes all the elements with the class faq on the page.
		 */
		_init: function() {
			// Find all the elements with the class faq, these are our faq containers
			var faqItems = document.querySelectorAll('.faq');

			// Loop through all the faq containers
			for (var index=0, ubound = faqItems.length; index<ubound; index++) {
				// Create an easy reference for use within the loop
				var faqItem = faqItems[index];
				// Add the toggle button to the faq item
				this._addToggleButton(faqItem);
				// We need the faq answer to placed within an additional container, let's create it now
				this._addInnerContainer(faqItem);
				// Close the faq item
				this._itemClose(faqItem);

				// Get the heading element and attach a click event handler
				var header = faqItem.querySelector('h3');
				// Before attaching an event listener make sure we found the heading element
				if (header != null) {
					header.addEventListener('click', this._onClickHandler.bind(this), false);
				}

				// Add an event handler for the transition end event
				faqItem.addEventListener('transitionend', this._onTransitionEndHandler.bind(this), false);
			}
			// Set the flag to indicate all faq items have been intialized
			this._initialized = true;
		},

		/**
		 * Returns whether or not the element is in its open state
		 * @param  {HTMLElement} element The element whose state needs to be checked
		 * @return {[type]}              True if the element has the class 'expanded'; otherwise false
		 */
		_isItemOpen: function(element) {
			// Return if the element has the expanded class
			return element.classList.contains('expanded');
		},

		_itemClose: function(element) {
			// Get the elements we need to manipulate
			var	faqContent = element.querySelector('.faq-content'),
				inner = element.querySelector('.inner'),
				label = element.querySelector('[data-role="action-label"]');
			// Check if we have all the required elements, else there is no point in continuing
			if (faqContent == null || inner == null || label == null) {
				return;
			}

			// Switch the status of the faq item
			element.classList.remove('expanded');
			element.classList.add('collapsed');
			// Update the text in the action label to reflect its new state
			this._setActionLabel(label, this._options.labelCloseState);

			// Remove the transition class, we don't want the next manipulation of the faq item to be animated
			faqContent.classList.remove('transition');
			// Check if the module has already been initialized, the very first time we just want the faq items
			// to close without the animation
			if (this._initialized) {
				// Set the max height of the answer to the to its actual current height, if we don't do this the
				// animation will look really odd as it has a false starting point
				faqContent.style.maxHeight = faqContent.offsetHeight + 'px';
				// This is not my own idea, I got this from http://jsfiddle.net/adambiggs/MAbD3/. Appearantly it is
				// needed to disable/enable the transition. Anyway, we will wait for 10ms before we set the next set
				// of css properties
				setTimeout(function() {
					// Add the transition class so the faq item will close with a nice animation and a fade in
					faqContent.classList.add('transition');
					// Set the css properties to hide the faq answer
					faqContent.style.maxHeight = 0;
					faqContent.style.opacity = 0;
				}, 10);
			} else {
				// The faq item is being closed during the intialization of the faq module. For this first time we don't
				// want the close animation but just have it be instant. We can achieve this by first changing the css
				// properties and after doing that apply the transition class. We do need to transition class on the faq
				// item or else it will open op without an animation when the user clicks on it for the first time
				faqContent.style.maxHeight = 0;
				faqContent.style.opacity = 0;
				// Wait a little bit before applying the class or there might still be a bit of a transition visible
				setTimeout(function() {
					faqContent.classList.add('transition');
				}, 10);
			}
		},

		/**
		 * Opens the faq item, making the answer visible to the user and screen readers
		 * @param  {HTMLElemet} element The faqItem that should have its state changed to open
		 */
		_itemOpen: function(element) {
			// Get the elements we need to manipulate
			var	faqContent = element.querySelector('.faq-content'),
				inner = element.querySelector('.inner'),
				label = element.querySelector('[data-role="action-label"]');
			// Check if we have all the required elements, else there is no point in continuing
			if (faqContent == null || inner == null || label == null) {
				return;
			}

			// Switch the status of the faq item
			element.classList.remove('collapsed');
			element.classList.add('expanded');
			// Update the text in the action label to reflect its new state
			this._setActionLabel(label, this._options.labelOpenState);
			// We need to reset the display property, it was none to hide the answer from screen readers
			faqContent.style.display = 'block';
			// Setting these properties will cause the answer to fade into view thanks to the transition class
			// we put on the faq item when we closed it
			faqContent.style.maxHeight = inner.offsetHeight + 'px';
			faqContent.style.opacity = 1;
		},

		/**
		 * Handles the click event of the heading element and its children
		 * @param  {Object} event The click event from the heading element or its children
		 */
		_onClickHandler: function(event) {
			var element = (event.currentTarget) ? event.currentTarget : event.srcElement;
			// Find the faq container which is the ancestor of the heading element
			var faqItem = this._findFaqItemForElement(element);
			// If no faq container could be found we can just skip the rest
			if (faqItem == null) {
				return;
			}

			if (this._isItemOpen(faqItem)) {
				this._itemClose(faqItem);
			} else {
				this._itemOpen(faqItem);
			}
		},

		/**
		 * Handles the transition end event which is fired when the collapse/expand animation is finished
		 * @param  {Object event The event which signals the transition has ended
		 */
		_onTransitionEndHandler: function(event){
			// Get the elements we need to work with
			var faqItem = (event.currentTarget) ? event.currentTarget : event.srcElement,
				faqContent = faqItem.querySelector('.faq-content');

			// If we didn't find the faq content element there is no point in continuing
			if (faqContent == null) {
				return;
			}

			// Check if the faq item is currently in its open state
			if (this._isItemOpen(faqItem)) {
				// We need to set the max height to something really big or else the element won't scale when the text
				// inside needs more vertical space. This could happen when the viewport is resized to a smaller size
				faqContent.style.maxHeight = '9999px';
			} else {
				// When the faq item is closed we need to set the display property of the answer to none or else screen readers
				// will still read it out to the user
				faqContent.style.display = 'none';
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