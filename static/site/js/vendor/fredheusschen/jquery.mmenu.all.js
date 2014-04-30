/*
 * jQuery mmenu v4.0.3
 * @requires jQuery 1.7.0 or later
 *
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 * www.frebsite.nl
 *
 * Dual licensed under the MIT and GPL licenses.
 * http://en.wikipedia.org/wiki/MIT_License
 * http://en.wikipedia.org/wiki/GNU_General_Public_License
 */


(function( $ ) {

	'use strict';

	var _PLUGIN_	= 'mmenu',
		_VERSION_	= '4.0.3';


	//	Plugin already excists
	if ( $[ _PLUGIN_ ] )
	{
		return;
	}

	//	Global variables
	var glbl = {
		$wndw: null,
		$html: null,
		$body: null,
		$page: null,
		$blck: null,
		$bgdiv: null,

		$allMenus: null,
		$scrollTopNode: null
	};

	var _c = {}, _e = {}, _d = {},
		_serialnr = 0;


	$[ _PLUGIN_ ] = function( $menu, opts, conf )
	{
		glbl.$allMenus = glbl.$allMenus.add( $menu );

		this.$menu = $menu;
		this.opts  = opts;
		this.conf  = conf;

		this.serialnr = _serialnr++;

		this._init();

		return this;
	};

	$[ _PLUGIN_ ].prototype = {

		open: function()
		{
			this._openSetup();
			this._openFinish();
			return 'open';
		},
		_openSetup: function()
		{
			//	Set opened
			this.$menu.addClass( _c.current );

			//	Close others
			glbl.$allMenus.not( this.$menu ).trigger( _e.close );


			//	Prevent tabbing out of the menu
			if ( this.conf.preventTabbing )
			{
				glbl.$wndw.off( _e.keydown )
					.on( _e.keydown,
						function( e )
						{
							if ( e.keyCode == 9 )
							{
								e.preventDefault();
								return false;
							}
						}
					);
			}

			//	Open
			glbl.$html.addClass( _c.opened );
			this.$menu.addClass( _c.opened );

			//	Scroll menu to top
			this.$menu.scrollTop( 0 );
		},
		_openFinish: function()
		{

			//	Opening
			glbl.$html.addClass( _c.opening );
			this.$menu.trigger( _e.opening );

		},
		close: function()
		{
			var that = this;

			//	Callback
			transitionend( glbl.$page,
				function()
				{
					that.$menu
						.removeClass( _c.current )
						.removeClass( _c.opened );

					glbl.$html
						.removeClass( _c.opened )
						.removeClass( _c.modal )
						.removeClass( _c.background );

					if ( that.opts.classes )
					{
						glbl.$html.removeClass( that.opts.classes );
					}

					glbl.$wndw
						.off( _e.resize )
						.off( _e.scroll );


					//	Closed
					that.$menu.trigger( _e.closed );

				}, this.conf.transitionDuration
			);

			//	Closing
			glbl.$html.removeClass( _c.opening );
			glbl.$wndw.off( _e.keydown );
			this.$menu.trigger( _e.closing );

			return 'close';
		},

		_init: function()
		{
			this.opts = extendOptions( this.opts, this.conf, this.$menu );
			this.direction = ( this.opts.slidingSubmenus ) ? 'horizontal' : 'vertical';

			//	INIT PAGE & MENU
			this._initPage( glbl.$page );
			this._initBackgroundDiv();
			this._initMenu();
			this._initBlocker();
			this._initPanles();
			this._initLinks();
			this._initOpenClose();
			this._bindCustomEvents();

			if ( $[ _PLUGIN_ ].addons )
			{
				for ( var a = 0; a < $[ _PLUGIN_ ].addons.length; a++ )
				{
					if ( typeof this[ '_addon_' + $[ _PLUGIN_ ].addons[ a ] ] == 'function' )
					{
						this[ '_addon_' + $[ _PLUGIN_ ].addons[ a ] ]();
					}
				}
			}
		},

		_bindCustomEvents: function()
		{
			var that = this;

			this.$menu
				.off( _e.open + ' ' + _e.close + ' ' + _e.setPage )
				.on( _e.open + ' ' + _e.close + ' ' + _e.setPage,
					function( e )
					{
						e.stopPropagation();
					}
				);

			//	Menu-events
			this.$menu
				.on( _e.open,
					function( e )
					{
						if ( $(this).hasClass( _c.current ) )
						{
							e.stopImmediatePropagation();
							return false;
						}
						return that.open( $(this), that.opts, that.conf );
					}
				)
				.on( _e.close,
					function( e )
					{
						if ( !$(this).hasClass( _c.current ) )
						{
							e.stopImmediatePropagation();
							return false;
						}
						return that.close( $(this), that.opts, that.conf );
					}
				)
				.on( _e.setPage,
					function( e, $p )
					{
						that._initPage( $p );
						that._initOpenClose();
					}
				);

			//	Panel-events
			var $panels = this.$menu.find( this.opts.isMenu && this.direction != 'horizontal' ? 'ul' : '.' + _c.panel );
			$panels
				.off( _e.toggle + ' ' + _e.open + ' ' + _e.close )
				.on( _e.toggle + ' ' + _e.open + ' ' + _e.close,
					function( e )
					{
						e.stopPropagation();
					}
				);

			if ( this.direction == 'horizontal' )
			{
				$panels
					.on( _e.open,
						function( e )
						{
							return openSubmenuHorizontal( $(this), that.$menu );
						}
					);
			}
			else
			{
				$panels
					.on( _e.toggle,
						function( e )
						{
							var $t = $(this);
							return $t.triggerHandler( $t.parent().hasClass( _c.opened ) ? _e.close : _e.open );
						}
					)
					.on( _e.open,
						function( e )
						{
							$(this).parent().addClass( _c.opened );
							return 'open';
						}
					)
					.on( _e.close,
						function( e )
						{
							$(this).parent().removeClass( _c.opened );
							return 'close';
						}
					);
			}
		},

		_initBlocker: function()
		{
			var that = this;

			if ( !glbl.$blck )
			{
				glbl.$blck = $( '<div id="' + _c.blocker + '" />' ).insertAfter( glbl.$page );
			}

			click( glbl.$blck,
				function()
				{
					if ( !glbl.$html.hasClass( _c.modal ) )
					{
						that.$menu.trigger( _e.close );
					}
				}, true, true
			);
		},
		_initBackgroundDiv: function()
		{

			if ( !glbl.$bgdiv )
			{
				glbl.$bgdiv = $( '<div id="' + _c.bgdiv + '" />' ).insertBefore( glbl.$page );
			}

		},
		_initPage: function( $p )
		{
			if ( !$p )
			{
				$p = $(this.conf.pageSelector, glbl.$body);
				if ( $p.length > 1 )
				{
					$[ _PLUGIN_ ].debug( 'Multiple nodes found for the page-node, all nodes are wrapped in one <' + this.conf.pageNodetype + '>.' );
					$p = $p.wrapAll( '<' + this.conf.pageNodetype + ' />' ).parent();
				}
			}

			$p.addClass( _c.page );
			glbl.$page = $p;
		},
		_initMenu: function()
		{
			//	Clone if needed
			if ( this.conf.clone )
			{
				this.$menu = this.$menu.clone( true );
				this.$menu.add( this.$menu.find( '*' ) ).filter( '[id]' ).each(
					function()
					{
						$(this).attr( 'id', _c.mm( $(this).attr( 'id' ) ) );
					}
				);
			}

			//	Strip whitespace
			this.$menu.contents().each(
				function()
				{
					if ( $(this)[ 0 ].nodeType == 3 )
					{
						$(this).remove();
					}
				}
			);

			//	Prepend to body
			this.$menu
				.prependTo( 'body' )
				.addClass( _c.menu );

			//	Add direction class
			this.$menu.addClass( _c.mm( this.direction ) );

			//	Add options classes
			if ( this.opts.classes )
			{
				this.$menu.addClass( this.opts.classes );
			}
			if ( this.opts.isMenu )
			{
				this.$menu.addClass( _c.ismenu );
			}
		},
		_initPanles: function()
		{
			var that = this;


			//	Refactor List class
			this.__refactorClass( $('ul.' + this.conf.listClass, this.$menu), 'list' );

			//	Add List class
			if ( this.opts.isMenu )
			{
				$('ul', this.$menu)
					.not( '.mm-nolist' )
					.addClass( _c.list );
			}

			var $lis = $('ul.' + _c.list + ' > li', this.$menu);

			//	Refactor Selected class
			this.__refactorClass( $lis.filter( '.' + this.conf.selectedClass ), 'selected' );

			//	Refactor Label class
			this.__refactorClass( $lis.filter( '.' + this.conf.labelClass ), 'label' );

			//	setSelected-event
			$lis
				.off( _e.setSelected )
				.on( _e.setSelected,
					function( e, selected )
					{
						e.stopPropagation();

						$lis.removeClass( _c.selected );
						if ( typeof selected != 'boolean' )
						{
							selected = true;
						}
						if ( selected )
						{
							$(this).addClass( _c.selected );
						}
					}
				);

			//	Refactor Panel class
			this.__refactorClass( $('.' + this.conf.panelClass, this.$menu), 'panel' );

			//	Add Panel class
			this.$menu
				.children()
				.filter( this.conf.panelNodetype )
				.add( this.$menu.find( 'ul.' + _c.list ).children().children().filter( this.conf.panelNodetype ) )
				.addClass( _c.panel );

			var $panels = $('.' + _c.panel, this.$menu);

			//	Add an ID to all panels
			$panels
				.each(
					function( i )
					{
						var $t = $(this),
							id = $t.attr( 'id' ) || _c.mm( 'm' + that.serialnr + '-p' + i );

						$t.attr( 'id', id );
					}
			);

			//	Add open and close links to menu items
			$panels
				.find( '.' + _c.panel )
				.each(
					function( i )
					{
						var $t = $(this),
							$u = $t.is( 'ul' ) ? $t : $t.find( 'ul' ).first(),
							$l = $t.parent(),
							$a = $l.find( '> a' ),
							$p = $l.closest( '.' + _c.panel );

						$t.data( _d.parent, $l );

						if ( $l.parent().is( 'ul.' + _c.list ) )
						{
							if ( that.direction == 'horizontal' )
							{
								var $url = $a.attr('href');
								$a.attr('href', '#' + $t.attr('id'));
								var $selected = $a.attr('data-active-page');
								$a.addClass(_c.head);
								$a.addClass(_c.subopen);
								if ($a.is('[data-module]')){
									$u.prepend( '<li class="' + _c.subtitle + ($selected ? ' ' + _c.selected : '') + ' mm-subheading"><a href="' + $url + '" data-module="' + $a.attr('data-module') + ($a.is('[data-options]') ? '" data-options=\''+$a.attr('data-options')+ '\'' : '"') + '>' + $a.html() + '</a></li>' );
								} else {
									$u.prepend( '<li class="' + _c.subtitle + ($selected ? ' ' + _c.selected : '') + ' mm-subheading"><a href="' + $url + '">' + $a.html() + '</a></li>' );
								}
								var $rparent = $p.parent();
								while ($rparent.is('li'))
								{
									var $ranchor = $rparent.find('> a, > span');
									$u.prepend( '<li class="' + _c.subtitle + '"><a class="' + _c.subclose + '" href="#' + $p.attr( 'id' ) + '">' + $ranchor.html() + '</a></li>' );
									$p = $rparent.closest('.' + _c.panel);
									$rparent = $p.parent();
								}
								var $tanchor = $rparent.find('li > a, li > span ').first();
								$u.prepend( '<li class="' + _c.subtitle + '"><a class="' + _c.subclose + '" href="#' + $p.attr( 'id' ) + '">' + $tanchor.html() + '</a></li>' );
							}
						}
					}
				);

			//	Link anchors to panels
			var evt = this.direction == 'horizontal' ? _e.open : _e.toggle;
			$panels
				.each(
					function( i )
					{
						var $opening = $(this),
							id = $opening.attr( 'id' );

						click( $('a[href="#' + id + '"]', that.$menu),
							function( e )
							{
								$opening.trigger( evt );
							}
						);
					}
			);

			if ( this.direction == 'horizontal' )
			{
				//	Add opened-classes
				var $selected = $('ul.' + _c.list + ' > li.' + _c.selected, this.$menu);
				$selected
					.add( $selected.parents( 'li' ) )
					.parents( 'li' ).removeClass( _c.selected )
					.end().each(
						function()
						{
							var $t = $(this),
								$u = $t.find( '> .' + _c.panel );

							if ( $u.length )
							{
								$t.parents( '.' + _c.panel ).addClass( _c.subopened );
								$u.addClass( _c.opened );
							}
						}
					)
					.closest( '.' + _c.panel ).addClass( _c.opened )
					.parents( '.' + _c.panel ).addClass( _c.subopened );
			}
			else
			{
				//	Replace Selected-class with opened-class in parents from .Selected
				$('li.' + _c.selected, this.$menu)
					.addClass( _c.opened )
					.parents( '.' + _c.selected ).removeClass( _c.selected );
			}

			//	Set current opened
			var $current = $panels.filter( '.' + _c.opened );
			if ( !$current.length )
			{
				$current = $panels.first();
			}
			$current
				.addClass( _c.opened )
				.last()
				.addClass( _c.current );
			$panels.not('.' + _c.opened).addClass(_c.hidden);

			//	Rearrange markup
			if ( this.direction == 'horizontal' )
			{
				$panels.find( '.' + _c.panel ).appendTo( this.$menu );
			}
		},
		_initLinks: function()
		{
			var that = this;

			var $a = $('ul.' + _c.list + ' > li > a', this.$menu)
				.not( '.' + _c.subopen )
				.not( '.' + _c.subclose )
				.not( '.' + _c.head )
//				.not( '[href^="#"]' )
				.not( '[rel="external"]' )
				.not( '[target="_blank"]' );

			$a.off( _e.click )
				.on( _e.click,
					function( e )
					{
						var $t = $(this),
							href = $t.attr( 'href' ),
							cancelled = false;


						// handle bumper module
						if ($t.is('a[data-module*="bumper"]')) {

							var bumperOpts = {
								'width':-1,
								'message':'deze link gaat naar een pagina met een iFrame welke mogelijk niet correct wordt weergegeven op uw apparaat. Wilt u toch doorgaan?',
							};
							if( $t.is('a[data-options]')){
								try {
									$.extend(true, bumperOpts, JSON.parse($t.attr('data-options')));
								}
								catch(err) {
									// failed parsing bumperOpts
									throw new Error('Error: "data-options" attribute containing a malformed JSON string.');
								}
							}
							if ((bumperOpts.width === -1 ) || (window.innerWidth < bumperOpts.width) ){
								if (confirm(bumperOpts.message)){
									cancelled = false;
								}
								else {
									e.preventDefault();
									e.stopPropagation();
									cancelled = true;
								}
							}
						}

						//	Set selected item
						if ( !cancelled && that.__valueOrFn( that.opts.onClick.setSelected, $t ) )
						{
							$t.parent().trigger( _e.setSelected );
						}

						//	Prevent default / don't follow link. Default: false
						var preventDefault = that.__valueOrFn( that.opts.onClick.preventDefault, $t, href.slice( 0, 1 ) == '#' );
						if ( preventDefault )
						{
							e.preventDefault();
							e.stopPropagation();
						}

						//	Block UI. Default: false if preventDefault, true otherwise
						if ( that.__valueOrFn( that.opts.onClick.blockUI, $t, !preventDefault ) )
						{
							glbl.$html.addClass( _c.blocking );
						}

						//	Close menu. Default: true if preventDefault, false otherwise
						if (!cancelled && that.__valueOrFn( that.opts.onClick.close, $t, preventDefault ) )
						{
							that.$menu.triggerHandler( _e.close );
						}
					});
		},
		_initOpenClose: function()
		{
			var that = this;

			//	Toggle menu
			var id = this.$menu.attr( 'id' );
			if ( id && id.length )
			{
				if ( this.conf.clone )
				{
					id = _c.umm( id );
				}

				click( $('a[href="#' + id + '"]'),
					function()
					{
						that.$menu.trigger( _e.open );
					}
				);
			}

			//	Close menu
			id = glbl.$page.attr( 'id' );
			if ( id && id.length )
			{
				click( $('a[href="#' + id + '"]'),
					function()
					{
						that.$menu.trigger( _e.close );
					}, false, true
				);
			}
		},

		__valueOrFn: function( o, $e, d )
		{
			if ( typeof o == 'function' )
			{
				return o.call( $e[ 0 ] );
			}
			if ( typeof o == 'undefined' && typeof d != 'undefined' )
			{
				return d;
			}
			return o;
		},

		__refactorClass: function( $e, c )
		{
			$e.removeClass( this.conf[ c + 'Class' ] ).addClass( _c[ c ] );
		}
	};


	$.fn[ _PLUGIN_ ] = function( opts, conf )
	{
		//	First time plugin is fired
		if ( !glbl.$wndw )
		{
			_initPlugin();
		}

		//	Extend options
		opts = extendOptions( opts, conf );
		conf = extendConfiguration( conf );

		return this.each(
			function()
			{
				var $menu = $(this);
				if ( $menu.data( _PLUGIN_ ) )
				{
					return;
				}
				$menu.data( _PLUGIN_, new $[ _PLUGIN_ ]( $menu, opts, conf ) );
			}
		);
	};

	$[ _PLUGIN_ ].version = _VERSION_;

	$[ _PLUGIN_ ].defaults = {
		moveBackground	: true,
		slidingSubmenus	: true,
		modal			: false,
		classes			: '',
		onClick			: {
			setSelected			: true
		}
	};
	$[ _PLUGIN_ ].configuration = {
		preventTabbing		: true,
		panelClass			: 'Panel',
		listClass			: 'List',
		selectedClass		: 'Selected',
		labelClass			: 'Label',
		pageNodetype		: 'div',
		panelNodetype		: 'ul, div',
		transitionDuration	: 400
	};



	/*
		SUPPORT
	*/
	(function() {

		var wd = window.document,
			ua = window.navigator.userAgent;

		var _touch				= 'ontouchstart' in wd,
			_overflowscrolling	= 'WebkitOverflowScrolling' in wd.documentElement.style,
			_transition			= (function() {
				var s = document.createElement( 'div' ).style;
				if ( 'webkitTransition' in s )
				{
					return 'webkitTransition';
				}
				return 'transition' in s;
			})(),
			_oldAndroidBrowser	= (function() {
				if ( ua.indexOf( 'Android' ) >= 0 )
				{
					var androidVersion = parseFloat( ua.slice( ua.indexOf( 'Android' ) +8 ) );
					if (4.0 === androidVersion && !(ua.indexOf( 'Chrome' ) >= 0) )
					{
						$('html').addClass('vier-nul-android');
					}
					return 2.4 > androidVersion;
				}
				return false;
			})();

		$[ _PLUGIN_ ].support = {

			touch: _touch,
			transition: _transition,
			oldAndroidBrowser: _oldAndroidBrowser,

			overflowscrolling: (function() {
				if ( !_touch )
				{
					return true;
				}
				if ( _overflowscrolling )
				{
					return true;
				}
				if ( _oldAndroidBrowser )
				{
					return false;
				}
				return true;
			})()
		};
	})();


	/*
		BROWSER SPECIFIC FIXES
	*/
	$[ _PLUGIN_ ].useOverflowScrollingFallback = function( use )
	{
		if ( glbl.$html )
		{
			if ( typeof use == 'boolean' )
			{
				glbl.$html[ use ? 'addClass' : 'removeClass' ]( _c.nooverflowscrolling );
			}
			return glbl.$html.hasClass( _c.nooverflowscrolling );
		}
		else
		{
			_useOverflowScrollingFallback = use;
			return use;
		}
	};


	/*
		DEBUG
	*/
	$[ _PLUGIN_ ].debug = function( msg ) {};
	$[ _PLUGIN_ ].deprecated = function( depr, repl )
	{
		if ( typeof console != 'undefined' && typeof console.warn != 'undefined' )
		{
			console.warn( 'MMENU: ' + depr + ' is deprecated, use ' + repl + ' instead.' );
		}
	};


	//	Global vars
	var _useOverflowScrollingFallback = !$[ _PLUGIN_ ].support.overflowscrolling;


	function extendOptions( o, c, $m )
	{
		if ( typeof o != 'object' )
		{
			o = {};
		}

		if ( $m )
		{
			if ( typeof o.isMenu != 'boolean' )
			{
				var $c = $m.children();
				o.isMenu = ( $c.length == 1 && $c.is( c.panelNodetype ) );
			}
			return o;
		}


		//	Extend onClick
		if ( typeof o.onClick != 'object' )
		{
			o.onClick = {};
		}


		//	DEPRECATED
		if ( typeof o.onClick.setLocationHref != 'undefined' )
		{
			$[ _PLUGIN_ ].deprecated( 'onClick.setLocationHref option', '!onClick.preventDefault' );
			if ( typeof o.onClick.setLocationHref == 'boolean' )
			{
				o.onClick.preventDefault = !o.onClick.setLocationHref;
			}
		}
		//	/DEPRECATED


		//	Extend from defaults
		o = $.extend( true, {}, $[ _PLUGIN_ ].defaults, o );


		return o;
	}
	function extendConfiguration( c )
	{
		if ( typeof c != 'object' )
		{
			c = {};
		}


		//	DEPRECATED
		if ( typeof c.panelNodeType != 'undefined' )
		{
			$[ _PLUGIN_ ].deprecated( 'panelNodeType configuration option', 'panelNodetype' );
			c.panelNodetype = c.panelNodeType;
		}
		//	/DEPRECATED


		c = $.extend( true, {}, $[ _PLUGIN_ ].configuration, c );

		//	Set pageSelector
		if ( typeof c.pageSelector != 'string' )
		{
			c.pageSelector = '> ' + c.pageNodetype;
		}

		return c;
	}

	function _initPlugin()
	{
		glbl.$wndw = $(window);
		glbl.$html = $('html');
		glbl.$body = $('body');

		glbl.$allMenus = $();


		//	Classnames, Datanames, Eventnames
		$.each( [ _c, _d, _e ],
			function( i, o )
			{
				o.add = function( c )
				{
					c = c.split( ' ' );
					for ( var d in c )
					{
						o[ c[ d ] ] = o.mm( c[ d ] );
					}
				};
			}
		);

		//	Classnames
		_c.mm = function( c ) { return 'mm-' + c; };
		_c.add( 'menu ismenu panel list current highest hidden head page blocker modal background opened opening subopen fullsubopen subclose subopened subtitle selected label nooverflowscrolling bgdiv' );
		_c.umm = function( c )
		{
			if ( c.slice( 0, 3 ) == 'mm-' )
			{
				c = c.slice( 3 );
			}
			return c;
		};

		//	Datanames
		_d.mm = function( d ) { return 'mm-' + d; };
		_d.add( 'parent style scrollTop offetLeft' );

		//	Eventnames
		_e.mm = function( e ) { return e + '.mm'; };
		_e.add( 'toggle open opening opened close closing closed keydown resize setPage setSelected transitionend touchstart touchend click scroll' );
		if ( !$[ _PLUGIN_ ].support.touch )
		{
			_e.touchstart	= _e.mm( 'mousedown' );
			_e.touchend		= _e.mm( 'mouseup' );
		}

		$[ _PLUGIN_ ]._c = _c;
		$[ _PLUGIN_ ]._d = _d;
		$[ _PLUGIN_ ]._e = _e;

		$[ _PLUGIN_ ].glbl = glbl;

		$[ _PLUGIN_ ].useOverflowScrollingFallback( _useOverflowScrollingFallback );
	}

	function openSubmenuHorizontal( $opening, $m )
	{
		if ( $opening.hasClass( _c.current ) )
		{
			return false;
		}

		var $panels = $('.' + _c.panel, $m),
			$current = $panels.filter( '.' + _c.current );

		$panels
			.removeClass( _c.highest )
			.removeClass( _c.current )
			.not( $opening )
			.not( $current )
			.addClass( _c.hidden );

		if ( $opening.hasClass( _c.opened ) )
		{
			$current
				.addClass( _c.highest )
				.removeClass( _c.opened )
				.removeClass( _c.subopened );
			$opening.nextAll( '.' + _c.panel, $m)
				.removeClass( _c.opened )
				.removeClass( _c.subopened );
		}
		else
		{
			$opening
				.addClass( _c.highest );

			$current
				.addClass( _c.subopened );
		}

		$opening
			.removeClass( _c.hidden )
			.removeClass( _c.subopened )
			.addClass( _c.current )
			.addClass( _c.opened );

		return 'open';
	}

	function transitionend( $e, fn, duration )
	{
		var s = $[ _PLUGIN_ ].support.transition;
		if ( s == 'webkitTransition' )
		{
			$e.one( 'webkitTransitionEnd', fn );
		}
		else if ( s )
		{
			$e.one( _e.transitionend, fn );
		}
		else
		{
			setTimeout( fn, duration );
		}
	}
	function click( $b, fn, onTouchStart, add )
	{
		if ( typeof $b == 'string' )
		{
			$b = $( $b );
		}

		var event = ( onTouchStart ) ? _e.touchstart : _e.click;

		if ( !add )
		{
			$b.off( event );
		}
		$b.on( event,function( e )
			{
				e.preventDefault();
				e.stopPropagation();

				fn.call( this, e );
			});
	}

})( jQuery );