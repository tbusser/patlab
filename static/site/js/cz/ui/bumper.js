define(['jquery'],function($) {

	'use strict';

	var exports = function(element, options) {

		this._options = options;
		this._element = element;

		$(this._element).bind('click',this._onClickItem.bind(this));

	};

	exports.options = {
		'width':-1,
		'message':'deze link gaat naar een pagina met een iFrame welke mogelijk niet correct wordt weergegeven op uw apparaat. Wilt u toch doorgaan?',
	};

	exports.prototype._onClickItem = function (event) {
		if ($(this._element).is('a') && ((this._options.width === -1 ) || (window.innerWidth < this._options.width) )){
			event.preventDefault();
			event.stopPropagation();
			var target = $(this._element).attr('href');
			if (confirm(this._options.message)){
				window.location = target;
			}
		}
	};


	return exports;

});
