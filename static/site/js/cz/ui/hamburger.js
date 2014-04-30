define(['jquery', 'mmenu'],function($) {

	'use strict';

	var exports = function(element, options) {

		this._element = element;
		var self = this;
		$('> .top-navbar .tab[role="tab"]', self._element).bind('click', self._onClickItem);
		$('> .top-navbar .tab:not([role="tab"])', self._element).bind('click', function(event){
			if(event.target && event.target.tagName === 'DIV'){
				$('> a', this)[0].click();
			}
		});
		$('div.page-header-top, #page-overlay').bind('click', function(){
			$('.tab[aria-selected="true"]').trigger('click');
		});

		// if Internet explorer 8 or lower we don't need the hamburger menu, so we skip the next part.
		if(!($('html').hasClass('ie'))) {
			var _leftNav = $('<nav id="left-nav"></nav>');
			var _innerList = $('<ul></ul>');
			$('.tab', this._element).each(function () {
				var listItem = $('<li></li>');
				if ($(this).is('a[role=tab]')){
					var anchor = $(this).clone();
					anchor.removeClass('tab');
					anchor.removeAttr('id role aria-controls aria-selected');
					if ($(this).hasClass('mm-selected')) {
						anchor.attr('data-active-page', 'true');
					}
					var divid = $(this).attr('aria-controls');
					var div = $('div[id=' + divid +']');
					var $a = $('>a',div);
					anchor.attr('href', $a.attr('href'));
					if ($a.is('[data-module]')){
						anchor.attr('data-module',$a.attr('data-module'));
						if ($a.is('[data-options]')){
							anchor.attr('data-options', $a.attr('data-options'));
						}
					}
					listItem.append(anchor);
					var actionMenu = $('.action-menu', div);
					$('> ul', div).clone().appendTo(listItem).attr('data-action-block', (actionMenu && actionMenu.length > 0 ) ? actionMenu.attr('data-action-block-id') : 'none');
				} else {
					listItem.html($(this).html());
				}
				_innerList.append(listItem);
			});
			_leftNav.append(_innerList);

			_leftNav.mmenu();

			var $element = $('#mm-m0-p0');
			var supplements = $('div.branding-bar ul.top-menu').clone();
			supplements.addClass('mm-list');
			var topListItem = $('<li></li>');
			topListItem.addClass('mm-toplevel');
			topListItem.append(supplements);
			$element.append(topListItem);

			var actionBlock;
			var startAdding = false;
			$('ul.mm-panel').each(function (index) {
				if ($(this).is('ul[data-action-block]')){
					actionBlock = $('.action-menu[data-action-block-id="' + $(this).attr('data-action-block') + '"]');
					startAdding = true;
				}
				if (!actionBlock || actionBlock.length === 0) {
					startAdding = false;
				}
				if (startAdding){
					var listItem = $('<li></li>');
					listItem.addClass('mm-action');
					listItem.append(actionBlock.clone(true));
					$(this).append(listItem);
				}
			});
		}
	};
	exports.options = {
	};

	exports.prototype._onClickItem = function (event) {
		event.preventDefault();
		event.stopPropagation();
		var targetTab = $(this);
		if (targetTab.is('.tab[aria-selected="true"]')){
			$('.tab').attr('aria-selected','false');
			$('.megadropdown').removeClass('show-mega').attr('aria-hidden','true').attr('aria-expanded','false');
			$('#page-overlay').removeClass('tab-selected');
		} else {
			$('.tab').attr('aria-selected','false');
			$('.megadropdown').removeClass('show-mega').attr('aria-hidden','true').attr('aria-expanded','false');
			targetTab.attr('aria-selected','true');
			$('#' + targetTab.attr('aria-controls')).addClass('show-mega').attr('aria-hidden','false').attr('aria-expanded','true');
			$('#page-overlay').addClass('tab-selected');
		}
	};

	return exports;

});
