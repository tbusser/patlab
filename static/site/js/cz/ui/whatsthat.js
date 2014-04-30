/**
 * Whats That™
 *
 * IE8 SUPPORT:
 * Due to behaviour in IE8 the original setup where the styles in _whatsthat.scss control the visibility of the mark element doesn't work. Setting
 * the `expanded` class on the button doesn't cause a repaint in IE8 which causes the mark element to remain invisible. Only once the mouse pointer
 * leaves the paragraph with the button does the mark element become visible.
 *
 * As a work around we will manipulate the display property of the mark element in this module. This does cause a repaint in IE8 and properly shows
 * and hides the mark element. Once support for IE8 is no longer needed the following bits can be taken out:
 *   - The markId parameter of the createButton method, the value of markId also no longer needs to be stored in the data-mark-id attribute
 *   - In _createInlineDefinition the do...while loop will no longer be needed, the generate ID also no longers needs to be assigned to the mark element
 *   - In _onClick the lines which retrieve the mark element by ID and the lines where the display property is manipulated can be removed
 *   - Be sure to make the changes needed in _whatsthat.scss to restore the original functionality
 */
define([], function(){
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

		this._init();
	};

	exports.options = {
		labelOpenState: 'Verberg de betekenis van ',
		labelCloseState: 'Toon de betekenis van '
	};

	exports.prototype = {
		_init: function() {
			this._convertFootnotes();
		},

		/**
		 * Once all the terms have been processed we need to check if the list which held the footnotes is
		 * empty, if it is it can be removed from the DOM.
		 */
		_cleanupFootnoteContainer: function() {
			// Get the element which held all the footnotes
			var footnoteContainer = document.querySelector('[data-role="footnotes"]');
			// Check if we found the element and if it no longer has any child elements
			if (footnoteContainer != null && footnoteContainer.children.length === 0){
				// The element is empty, we can safely remove it from the DOM
				footnoteContainer.parentNode.removeChild(footnoteContainer);
			}
		},

		/**
		 * Initializes all the terms which need explanation by moving the explanation inline.
		 */
		_convertFootnotes: function() {
			// Find all difficult terms
			var whatsthats = document.querySelectorAll('[data-role="explanation"]');
			for (var index=0, ubound=whatsthats.length; index<ubound; index++) {
				// Get the span in which the term is placed
				var whatsthat = whatsthats[index];
				// Get the anchor to go to the footnote
				var footnoteId = this._getScrubedLinkTargetToFootnote(whatsthat);
				// Check if we actually found an anchor element, if not we stop processing this term and continue with the next one
				if (footnoteId == null) {
					continue;
				}

				// Get the list item which holds the footnote for the current term
				var footnote = document.querySelector(footnoteId);
				// Check if we actually found the footnote, if not we stop processing this term and continue with the next one
				if (footnote == null) {
					continue;
				}
				// Remove the link to return to the content from the footnote as it won't be necessary anymore once
				// the text of the footnote is placed inline. Because the link might be nested within another element
				// we'll use _removeElementFromContainer just to be safe
				this._removeElementFromContainer(footnote.querySelector('[data-role="return-to-content"]'), footnote);
				// Create an element next to the term we're processing with the content from the footnote
				var markid = this._createInlineDefinition(footnote, whatsthat);
				// Create the button to show/hide the explanation
				this._createButton(whatsthat, markid);

				// We can now remove the footnote from the list
				footnote.parentNode.removeChild(footnote);
			}
			this._cleanupFootnoteContainer();
		},

		/**
		 * We need to replace the element which holds the term with a button, this way the user can navigate to the toggle using
		 * the keyboard.
		 * @param  {HTMLElement} element The element which needs to be replaced by a button.
		 * @param {String} markId The ID of the mark element which holds the explanation of the term
		 */
		_createButton: function(element, markId) {
			// Create the button and span element we need
			var button = document.createElement('button'),
				span = document.createElement('span');

			// Initialize the attributes of the button
			button.setAttribute('type', 'button');
			button.setAttribute('data-role', 'explanation-toggle');
			// Remember the ID of the mark element which belongs to this button
			button.setAttribute('data-mark-id', markId);
			// Initialize the attributes of the span and place it in the button
			span.setAttribute('data-role', 'action-label');
			button.appendChild(span);
			// Move all remaining content from the term container to the button
			while (element.hasChildNodes()) {
				button.appendChild(element.firstChild);
			}
			element.parentNode.replaceChild(button, element);
			// Attach a click event handler to the button
			button.addEventListener('click', this._onClick.bind(this));
		},

		/**
		 * Moves the content from the footnote to a mark element which is inserted in the DOM right after the
		 * container with the term that needs explaning
		 * @param  {HTMLElement} footnote       The element which holds the explanation of the term
		 * @param  {HTMLElement} siblingElement The element which holds the term which needs explaining
		 */
		_createInlineDefinition: function(footnote, siblingElement) {
			// We will create a mark element to place the definition of the term in
			var mark = document.createElement('mark'),
				markId = null;
			// We need to make sure the mark element has a unique ID, this seems to be safe enough. Keep
			// generating an ID till we don't get any elements when we call getElementById
			do {
				// Create an ID by taking the footnote ID, add a random number between 0 and 1000
				markId = 'mark-' + footnote.id + '-' + Math.floor(Math.random() * 1000);
			} while (document.getElementById(markId) != null);
			// Set the ID for the mark element
			mark.id = markId;
			// Move all the child elements from the footnote to the mark element
			while (footnote.hasChildNodes()) {
				mark.appendChild(footnote.firstChild);
			}
			// Insert the mark element after the container holding the term which needs the explanation
			siblingElement.parentNode.insertBefore(mark, siblingElement.nextSibling || null);
			return mark.id;
		},

		/**
		 * This method will remove the link to the footnotes from the container and returns the ID of the footnote which belongs
		 * to the term we're processing
		 * @param  {HTMLElement} container The element which holds the term that needs to explained, typically this will be a span element
		 * @return {String}                The ID of the footnote which holds the explanation of the term
		 */
		_getScrubedLinkTargetToFootnote: function(container) {
			// Find the link with the container, make sure we found it before we continue
			var anchor = container.querySelector('a');
			if (anchor == null) {
				return null;
			}
			// Remove the anchor, and whatever ancestors it has, from the container
			this._removeElementFromContainer(anchor, container);
			// Create the ID of the footnote belonging to this term. This ID follows a pattern that makes it possible
			// to create it here.
			var term = '#term-' + container.getAttribute('data-term').replace(' ', '-');
			// Return the ID
			return term;
		},

		_onClick: function(event) {
			var element = (event.currentTarget) ? event.currentTarget : event.srcElement,
				label = element.querySelector('[data-role="action-label"]'),
				mark = document.getElementById(element.getAttribute('data-mark-id'));

			// Make sure we got the label before we continue;
			if (label == null || mark == null) {
				return;
			}
			if (element.classList.contains('expanded')) {
				element.classList.remove('expanded');
				this._setActionLabel(label, this._options.labelCloseState);
				// Hide the mark element
				mark.style.display = 'none';
			} else {
				element.classList.add('expanded');
				this._setActionLabel(label, this._options.labelOpenState);
				// Show the mark element
				mark.style.display = 'block';
			}
		},

		/**
		 * This method will traverse the parent list of 'element' until it reaches the 'container' element. It will then remove the
		 * child element which is an ancestor of 'element' from the 'container' element.
		 * @param  {HTMLElement} element   The element whose parent list should be traversed until we find the direct child of the container element
		 * @param  {HTMLElement} container The container element which ultimately is the ancestor of the 'element'
		 */
		_removeElementFromContainer: function(element, container) {
			// Initialize the variable with the anchor element. Since the link element might not be a direct child of the
			// container we need to find the actual element which is a direct child of the container
			var nodeToRemove = element;
			// Keep traversing up the node list until we find the element which is a direct child of the container or until
			// there are no more nodes to traverse
			while (nodeToRemove != null && nodeToRemove.parentNode != container) {
				nodeToRemove = nodeToRemove.parentNode;
			}
			// Check if we found a node which we can remove
			if (nodeToRemove != null) {
				// Remove the node from the container, this will remove the link to the footnote from the page
				container.removeChild(nodeToRemove);
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