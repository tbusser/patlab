(function() {
	'use strict';

	var iframe = document.getElementById('sg-iframe');
	var targetOrigin = (window.location.protocol == 'file:') ? '*' : window.location.protocol+'//'+window.location.host;

	var	bodySize = parseInt(window.getComputedStyle(document.body, null).getPropertyValue('font-size'), 10),
		discoId = null,
		discoMode = false,
		fullWidth = document.body.clientWidth,
		hayButton = document.getElementById('size-hay'),
		hayId = null,
		hayMode = false,
		lastSize = 0,
		updateSizeHandle,
		discoButton = document.getElementById('size-disco'),
		sizeEm = document.getElementById('size-em'),
		sizePx = document.getElementById('size-px'),
		minViewportWidth = 240, //Minimum Size for Viewport
		maxViewportWidth = 2600; //Maxiumum Size for Viewport

	var bpSmall = (34 * 16),
		bpMedium = (44 * 16),
		bpLarge = (56 * 16),
		bpXlarge = (100 * 16);


	/*	================================
		EVENT HANDLERS
		============================= */
	// Listen to the resize event to we can update the value of the
	// fullWidth variable as this should always be the same as the
	// client width
	window.addEventListener('resize', function() {
		fullWidth = document.body.clientWidth;
	});
	/*	== EVENT HANDLERS =========== */


	/*	================================
		HEADER
		============================= */
	function headerClickHandler(event) {
		event.preventDefault();
		var target = (event.target) ? event.target : event.srcElement;
		if (target.nodeName === 'A' && iframe != null) {
			iframe.contentWindow.location.replace(target.getAttribute('href'));
		}
	}

	var header = document.querySelector('.sg-header');
	if (header != null) {
		// Listen to the clicks on the header and child elements to intercept clicks
		// on the menu items
		header.addEventListener('click', function(event) {
			headerClickHandler(event);
		});
	}
	/*	== HEADER =================== */


	/*	================================
		SIZE BUTTONS
		============================= */
	var element = document.getElementById('size-xsmall');
	if (element != null) {
		element.addEventListener('click', function() {
			resizeIframe(getRandom(minViewportWidth, bpSmall - 1), true);
		});
	}

	element = document.getElementById('size-small');
	if (element != null) {
		element.addEventListener('click', function() {
			resizeIframe(getRandom(bpSmall, bpMedium - 1), true);
		});
	}

	element = document.getElementById('size-medium');
	if (element != null) {
		element.addEventListener('click', function() {
			resizeIframe(getRandom(bpMedium, bpLarge - 1), true);
		});
	}

	element = document.getElementById('size-large');
	if (element != null) {
		element.addEventListener('click', function() {
			resizeIframe(getRandom(bpLarge, bpXlarge - 1), true);
		});
	}

	element = document.getElementById('size-xlarge');
	if (element != null) {
		element.addEventListener('click', function() {
			resizeIframe(getRandom(bpXlarge, fullWidth), true);
		});
	}

	element = document.getElementById('size-full');
	if (element != null) {
		element.addEventListener('click', function() {
			resizeIframe(fullWidth, true);
		});
	}

	element = document.getElementById('size-random');
	if (element != null) {
		element.addEventListener('click', function() {
			resizeIframe(getRandom(minViewportWidth, fullWidth), true);
		});
	}
	/*	== SIZE BUTTONS ============= */


	/*	================================
		DISCO MODE
		============================= */
	if (discoButton != null) {
		discoButton.addEventListener('click', function() {
			hayStop();
			if (discoMode) {
				discoStop(event);
			} else {
				discoStart(event);
			}
		});
	}

	/* Disco Mode */
	function disco() {
		var newWidth = getRandom(minViewportWidth, fullWidth);
		resizeIframe(newWidth, true);
		//updateSizeReading(newWidth);
	}

	function discoStart() {
		discoButton.classList.add('active');
		discoMode = true;
		discoId = setInterval(disco, 900);
	}

	function discoStop() {
		discoButton.classList.remove('active');
		discoMode = false;
		clearInterval(discoId);
		discoId = false;
	}
	/*	== DISCO MODE =============== */


	/*	================================
		HAY MODE
		============================= */
	if (hayButton != null) {
		// Get the HTML element
		var html = document.querySelector('html');
		if (html != null) {
			// Check for the no-csstransitions class which is added by Modernizr when the browser doesn't
			// support transitions
			if (html.classList.contains('no-csstransitions')) {
				// There are no transitions available, since this is a feature the Hay function really depends on there
				// is no use in offering it to the user at this point. Remove the button!
				hayButton.parentNode.removeChild(hayButton);
				hayButton = null;
			} else {
				// CSS transitions are available to us, attach a click handler to the button to start/stop the Hay mode
				hayButton.addEventListener('click', function() {
					discoStop();
					if (hayMode) {
						hayStop();
					} else {
						hayStart();
					}
				});
			}
		}
	}

	//Stop Hay! Mode
	function hayStop() {
		if (hayMode) {
			var iframeWidth = iframe.offsetWidth;
			iframe.classList.remove('hay-mode');
			resizeIframe(Math.round(iframeWidth), false);
			hayButton.classList.remove('active');
			hayMode = false;
			if (updateSizeHandle != null) {
				clearInterval(updateSizeHandle);
				updateSizeHandle = null;
			}
		}
	}

	// start Hay! mode
	function hayStart() {
		hayMode = true;
		hayButton.classList.add('active');
		resizeIframe(minViewportWidth, false);

		var handle = window.setTimeout(function(){
			// The hay-mode class makes the width animation last for 40 seconds
			iframe.classList.add('hay-mode');
			// Resize to full width, we don't want the animation class restored
			resizeIframe(fullWidth, false);
			// Every 100ms we will update the size reading and check the current width
			updateSizeHandle = setInterval(function() {
				var size = iframe.offsetWidth;
				updateSizeReading(size);
				// Once the size of the iframe has reached its max we can kill this interval to update the size reading
				if (size >= fullWidth) {
					hayStop();
				}
			}, 100);
		}, 200);
	}
	/*	== HAY MODE ================= */

	/*	================================
		PIXEL INPUT
		============================= */
	if (sizePx != null) {
		sizePx.addEventListener('keydown', function(event) {
			var val = Math.floor(event.currentTarget.value);

			if(event.keyCode == 38) { //If the up arrow key is hit
				val++;
				if (val > fullWidth) { val = fullWidth; }
				resizeIframe(val);
			} else if(event.keyCode == 40) { //If the down arrow key is hit
				val--;
				if (val < minViewportWidth) { val = minViewportWidth; }
				resizeIframe(val);
			} else if(event.keyCode == 13) { //If the Enter key is hit
				event.preventDefault();
				resizeIframe(val);
				//$(this).blur();
			}
		});

		sizePx.addEventListener('blur', function(event) {
			var val = Math.floor(event.currentTarget.value);
			resizeIframe(val);
		});

		sizePx.addEventListener('keyup', function(event) {
			Math.floor(event.currentTarget.value);
		});
	}
	/*	== PIXEL INPUT ============== */


	/*	================================
		EM INPUT
		============================= */
	if (sizeEm != null) {
		sizeEm.addEventListener('keydown', function(event) {
			var val = parseFloat(event.currentTarget.value);

			if(event.keyCode == 38) { //If the up arrow key is hit
				val++;
				if (val * bodySize > fullWidth) { val = fullWidth / bodySize; }
				resizeIframe(val * bodySize);
			} else if(event.keyCode == 40) { //If the down arrow key is hit
				val--;
				if (val * bodySize < minViewportWidth) { val = minViewportWidth / bodySize; }
				resizeIframe(val * bodySize);
			} else if(event.keyCode == 13) { //If the Enter key is hit
				event.preventDefault();
				resizeIframe(val * bodySize);
				//$(this).blur();
			}
		});

		sizeEm.addEventListener('focus', function(event) {
			event.currentTarget.select();
		});

		sizeEm.addEventListener('blur', function(event) {
			var val = parseFloat(event.currentTarget.value);
			resizeIframe(val * bodySize);
		});

		sizeEm.addEventListener('keyup', function(event) {
			parseFloat(event.currentTarget.value);
		});
	}
	/*	== EM INPUT ================= */


	function resizeIframe(size, animate) {
		animate = animate || false;
		var theSize;

		if(size > fullWidth) { //If the entered size is larger than the max allowed viewport size, cap value at max vp size
			theSize = fullWidth;
		} else if(size < minViewportWidth) { //If the entered size is less than the minimum allowed viewport size, cap value at min vp size
			theSize = minViewportWidth;
		} else {
			theSize = size;
		}

		//Conditionally remove CSS animation class from viewport
		if(!animate) {
			iframe.classList.remove('iframe-animate');
		} else {
			iframe.classList.add('iframe-animate');
		}

		iframe.setAttribute('style', 'width:'+ theSize + 'px');
		iframe.contentWindow.postMessage({ 'resize': 'true' }, targetOrigin);
		updateSizeReading(theSize);
	}

	//Update Pixel and Em inputs
	//'size' is the input number
	//'unit' is the type of unit: either px or em. Default is px. Accepted values are 'px' and 'em'
	//'target' is what inputs to update. Defaults to both
	function updateSizeReading(size, unit, target) {
		var emSize, pxSize = null;

		if (unit ==='em') { //If size value is in em units
			emSize = size;
			pxSize = Math.floor(size * bodySize);
		} else { //If value is px or absent
			pxSize = size;
			emSize = size / bodySize;
		}

		if (target === 'updatePxInput') {
			sizePx.value = pxSize;
		} else if (target === 'updateEmInput') {
			sizeEm.value = emSize.toFixed(2);
		} else {
			sizeEm.value = emSize.toFixed(2);
			sizePx.value = pxSize.toFixed(0);
		}
	}

	/* Returns a random number between min and max */
	function getRandom (min, max) {
		return Math.round(Math.random() * (max - min) + min);
	}

	updateSizeReading(fullWidth);
})();