(function() {
	'use strict';

	function addButton(element) {
		var button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.classList.add('sg-code-toggle');
		setCaption(button, 'expand');
		element.appendChild(button);

		button.addEventListener('click', onClickHandler.bind(this), false);
	}

	function findPreAncestor(element) {
		var result = null;
		while (element.parentNode != null && result == null) {
			if (element.parentNode.classList.contains('sg-code')) {
				result = element.parentNode;
			} else {
				element = element.parentNode;
			}
		}
		return result;
	}

	function onClickHandler(event) {
		var element = event.currentTarget;
		var preElement = findPreAncestor(element);

		if (preElement == null) {
			return;
		}

		if (element.getAttribute('data-is-expanded') === '1') {
			element.setAttribute('data-is-expanded', '0');
			setCaption(element, 'expand');
			preElement.classList.remove('expanded');
		} else {
			element.setAttribute('data-is-expanded', '1');
			setCaption(element, 'collapse');
			preElement.classList.add('expanded');
		}
	}

	function setCaption(element, text) {
		while (element.hasChildNodes()) {
			element.removeChild(element.firstChild);
		}
		var caption = document.createTextNode(text);
		element.appendChild(caption);
	}

	/*	================================
		INIT
		============================= */
	var containers = document.querySelectorAll('.sg-code');
	for (var index=0, ubound=containers.length; index<ubound; index++) {
		var container = containers[index];
		addButton(container);
	}
	/*	== INIT ===================== */
})();