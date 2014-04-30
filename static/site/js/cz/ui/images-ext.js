define([''], function(){
	'use strict';

	var getKeys, isArray, nextTick;

	nextTick = window.requestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					function (callback) {
					window.setTimeout(callback, 1000 / 60);
				};

	function applyEach (collection, callbackEach) {
		var i = 0,
			length = collection.length,
			new_collection = [];

		for (; i < length; i++) {
			new_collection[i] = callbackEach(collection[i], i);
		}

		return new_collection;
	}

	function returnDirectValue (value) {
		return value;
	}

	getKeys = typeof Object.keys === 'function' ? Object.keys : function (object) {
		var keys = [],
			key;

		for (key in object) {
			keys.push(key);
		}

		return keys;
	};

	function hasOwnProperty(property) {
		if (window.hasOwnProperty) {
			return window.hasOwnProperty(property);
		} else {
			return Object.prototype.hasOwnProperty(property);
		}
	}

	isArray = function isArray (object) {
		return Object.prototype.toString.call(object) === '[object Array]';
	};

	if (typeof Object.merge !== 'function') {
		Object.merge = function (o1, o2) { // Function to merge all of the properties from one object into another
			for(var i in o2) { o1[i] = o2[i]; }
			return o1;
		};
	}

	var exports = function(element, options) {
		// Default AMD/Conditioner stuff
		this._element = element;
		this._options = Object.merge(exports.options, options);

		// Initialize some vars which we'll be using through out the module
		this._imagesOffScreen = [];
		this._initialized = false;
		this._isResizing = false;
		this._scrolled = false;
		this._viewportHeight = document.documentElement.clientHeight;
		this._widthsMap = this._createWidthsMap(this._options.availableWidths);

		// Do some pre-initializations for the module
		this._refreshPixelRatio();
		this._initEmptyImage();


		this._options.availableWidths = this._options.availableWidths.sort(function (a, b) {
			return a - b;
		});

		this._images = applyEach(document.querySelectorAll('.image-replace'), returnDirectValue);
		this._placeholders = applyEach(document.querySelectorAll(this._options.selector), returnDirectValue);
		this._changePlaceholdersToEmptyImages();

		var self = this;
		nextTick(function() {
			self._init();
		});
	};

	exports.options = {
		availablePixelRatios: [1, 2],
		availableWidths: [96, 130, 165, 200, 235, 270, 304, 340, 375, 410, 445, 485, 520, 555, 590, 625, 660, 695, 736],
		breakpoints: [544, 704, 896, 1600, 30000],
		className: 'image-replace',
		lazyLoad: true,
		onResize: true,
		resizeDelay: 500,
		scrollDelay: 250,
		scrollOffset: 300,
		selector: 'div[role="image-placeholder"]'
	};

	exports.prototype = {
		_changeImageSrcToNewImageDimension: function(src, selectedWidth, selectedHeight, breakpoint) {
			var result = src.replace('{width}', selectedWidth);
			if (selectedHeight != null) {
				result = result.replace('{height}', selectedHeight);
			}
			if (breakpoint != null) {
				var bparray = ['XS', 'S', 'M', 'X', 'XL'];
				result += '&text=' + selectedWidth + 'x' + selectedHeight + '+/+bp=' + bparray[this._options.breakpoints.indexOf(breakpoint)];
			}
			return result;
		},

		_changePlaceholdersToEmptyImages: function() {
			var self = this;

			applyEach(this._placeholders, function(element, index) {
				if (self._options.lazyLoad) {
					if (self._isThisElementOnScreen(element)) {
						self._images.push(self._createEmptyImage(element));
					} else {
						self._imagesOffScreen.push(element);
					}
				} else {
					this._placeholders[index] = self._createEmptyImage(element);
				}
			});

			if (this._initialized) {
				this._checkImagesNeedReplacing(this._images);
			}
		},

		_checkImagesNeedReplacing: function(images) {
			var self = this;

			if (!this._isResizing) {
				this._isResizing = true;
				this._refreshPixelRatio();

				applyEach(images, function(image) {
					self._replaceImageBasedOnScreenDimensions(image);
				});

				this._isResizing = false;
			}
		},

		_createEmptyImage: function(element) {
			// if the element is already a responsive image then we don't replace it again
			if (element.className.match(new RegExp('(^| )' + this._options.className + '( |$)'))) {
				return element;
			}

			var gif = this._gif.cloneNode(false);

			gif.width = element.getAttribute('data-width');
			gif.setAttribute('data-src', element.getAttribute('data-src'));
			var value = element.getAttribute('data-ratio');
			if (value != null) {
				gif.setAttribute('data-ratio', value);
			}
			value = element.getAttribute('data-art-direction');
			if (value != null) {
				gif.setAttribute('data-art-direction', value);
			}
			gif.setAttribute('alt', element.getAttribute('data-alt') || this._gif.alt);

			for (var index=0,ubound=element.classList.length;index<ubound;index++) {
				gif.classList.add(element.classList[index]);
			}
			element.parentNode.replaceChild(gif, element);
			gif.removeAttribute('height');

			return gif;
		},

		_createWidthsMap: function(widths) {
			var map = {},
				index = widths.length;

			while(index--) {
				map[widths[index]] = null;
			}

			return map;
		},

		_determineAppropriateResolution: function(image) {
			return this._getClosestValue(image.clientWidth, this._options.availableWidths) * this._devicePixelRatio;
		},

		_getClosestValue: function getClosestValue(baseValue, candidates) {
			var i = candidates.length,
			selectedWidth = candidates[i - 1];

			while (i--) {
				if (baseValue <= candidates[i]) {
					selectedWidth = candidates[i];
				}
			}

			return selectedWidth;
		},

		_init: function() {
			this._initialized = true;
			this._checkImagesNeedReplacing(this._images);

			if (this._options.onResize) {
				this._registerResizeEvent();
			}

			if (this._options.lazyLoad) {
				this._registerScrollEvent();
			}
		},

		_initEmptyImage: function() {
			this._gif = document.createElement('img');
			this._gif.src = 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7';
			this._gif.className = this._options.className;
			this._gif.alt = '';
		},

		_isThisElementOnScreen: function(element) {
			// document.body.scrollTop was working in Chrome but didn't work on Firefox, so had to resort to window.pageYOffset
			// but can't fallback to document.body.scrollTop as that doesn't work in IE with a doctype (?) so have to use document.documentElement.scrollTop
			var offset = (hasOwnProperty('pageYOffset')) ? window.pageYOffset : document.documentElement.scrollTop;
			var elementOffsetTop = 0;

			if (element.offsetParent) {
				do {
					elementOffsetTop += element.offsetTop;
				}
				while (element = element.offsetParent);
			}

			return (elementOffsetTop < (this._viewportHeight + offset + this._options.scrollOffset)) ? true : false;
		},

		/**
		 * This event handler is attached to the window resize event. It is the trigger to re-evaluate all the images on
		 * the pages and replace them with the proper sized image. Because this event can be fired multiple times when the
		 * user is busy resizing and there is no way to check if it is the final resize event, we will add a timeout each
		 * time we get the event. Only when there hasn't been a new resize event in [_resizeDelay]ms will we do the actual work.
		 */
		_onWindowResize: function(event) {
			// Check if we have a timeout set for handling the resize event
			if (this._resizeTimer != null) {
				// Clear the timeout
				clearInterval(this._resizeTimer);
				this._resizeTimer = null;
			}
			var self = this;
			// Setup a new timeout for checking which images need replacing
			this._resizeTimer = setTimeout(function() {
				self._checkImagesNeedReplacing(self._images);
			}, this._options.resizeDelay);
		},

		_refreshPixelRatio: function() {
			this._devicePixelRatio = this._getClosestValue((window.devicePixelRatio || 1), this._options.availablePixelRatios);
		},

		_registerResizeEvent: function() {
			var self = this;

			window.addEventListener('resize', function() {
				self._onWindowResize();
			}, false);
		},

		_registerScrollEvent: function() {
			var self = this;

			this._scrolled = false;
			this._interval = window.setInterval(function(){
				self._scrollCheck();
			}, self._options.scrollDelay);

			window.addEventListener('scroll', function() {
				self._scrolled = true;
			}, false);
		},

		_replaceImageBasedOnScreenDimensions: function(image) {
			var breakpoint, computedWidth, computedHeight, src;

			computedWidth = this._determineAppropriateResolution(image);
			if (image.getAttribute('data-ratio') != null) {
				computedHeight = Math.round(computedWidth / parseFloat(image.getAttribute('data-ratio')));
			}
			if (image.getAttribute('data-art-direction') === '1') {
				breakpoint = this._getClosestValue(document.body.clientWidth, this._options.breakpoints);
			}
			src = this._changeImageSrcToNewImageDimension(image.getAttribute('data-src'), computedWidth, computedHeight, breakpoint);
			image.src = src;
		},

		_scrollCheck: function() {
			if (this._scrolled) {
				// Check if there are still image which need to be lazy loaded
				if (this._imagesOffScreen.length === 0) {
					// No more images to lazy load, we no longer need to monitor the
					// scroll event
					window.clearInterval(this._interval);
					console.log('No more images to lazy load, scroll interval cleared');
				} else {
					console.log(this._imagesOffScreen.length + ' image(s) need to be loaded');
				}
				this._placeholders = this._imagesOffScreen.slice(0);
				this._imagesOffScreen.length = 0;
				this._changePlaceholdersToEmptyImages();
				this._scrolled = false;
			}
		}
	};

	return exports;
});