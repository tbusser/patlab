/*  Dynamic iframe resizing. This script works with dyframe.js on the client to resize 
iframes to the size of its content.
We know multiple ways to do this. The scripts selects the best way to do this. 
The options are: postMessage API (IE8/FF3/Opera9/Safari4?), inter iframe communication 
(on local pages (or subdomain pages) for older browsers, cross domain communication throught 
the server by cookie, when inter face communication isn't possible and we have static frame resizing. 
This is resizing to the window height */

/* This class listens for the height of the content through the postMessage API 
(IE8/FF3/Opera9/Safari4?) */
function MessageEventResizeListener(newIframeElement, fireAfterResizeEvents) {
    var self = this;
    self.iframeElement = newIframeElement;
    self.AfterResizeEventHandler = fireAfterResizeEvents;

    self.initialize = function() {
        if (window.addEventListener) {
            window.addEventListener("message", self.messageReceived, false);
        } else {
            window.attachEvent("onmessage", self.messageReceived);
        }
    };

    self.messageReceived = function(e) {
        var result = e.data.split('_');
        //check if the message is for this iframe, by correlating the iframe name 
        //with the send guid?
        if (result[1] == self.iframeElement.name.split('_')[1]) {
            var new_height = parseInt(result[0]);
            self.iframeElement.height = new_height;

            //if the height is set, respond with the current height to the client
            e.source.postMessage(new_height, e.origin);

            if (self.AfterResizeEventHandler != null) {
                self.AfterResizeEventHandler();
            }
        }
    };
};

/*  This class receives the height of the iframe through inter iframe communication. This only 
works for local pages */
function InterframeResizeListener(newIframeElement, fireAfterResizeEvents) {
    var self = this;
    self.iframeElement = newIframeElement;
    self.Name = newIframeElement.name;
    self.Guid = newIframeElement.name.split('_')[1];
    self.AfterResizeEventHandler = fireAfterResizeEvents;
    self.BackWardCompatListener = null;
    self.CookieListenerStopped = false;

    self.initialize = function(backwardCompatListener) {
        SetDocumentDomainToRoot();
        self.BackWardCompatListener = backwardCompatListener;
        //resize is called from within the iframe, no listening needed
    };

    self.resize = function(new_height) {
        self.iframeElement.height = new_height;

        if (self.AfterResizeEventHandler != null) {
            self.AfterResizeEventHandler();
        }

        if (self.CookieListenerStopped == false) {
            if (self.BackWardCompatListener != null) {
                self.BackWardCompatListener.stopCookieListener();
                self.CookieListenerStopped = true;
                return true;
            } else {
                return false;
            }
        }
        return true;
    };

    /* Used by the IFrameManager to find the right listener */
    self.hasUrl = function(guid, doc_href) {
        try {
            if (self.Guid == guid) {
                if (self.iframeElement.contentWindow.document.location.href == doc_href) {
                    return true;
                }
            }
        } catch (e) {
            /*  if a iframe is on another on another domain or https, we do not use local reporting
            so we don't want this iframe. so return false */
        }
        return false;
    };

    /* Sets the document.domain property to the root domain */
    function SetDocumentDomainToRoot() {
        if (document.domain.indexOf('.') != -1) {
            var domainItems = document.domain.split('.');
            try {
                document.domain = domainItems[domainItems.length - 2] + '.' + domainItems[domainItems.length - 1];
            } catch (exc) { }
        }
    };
};

/*  This class listens for the height of the iframe by checking a cookie on the host
domain. This function is only used when local communication isn't possible. This is when
pages are on other domains, or when pages are http and https */
function CookieResizeListener(newIframeElement, fireAfterResizeEvents) {
    var self = this;
    self.Interval = null;
    self.StopInterval = false;
    self.iframeElement = newIframeElement;
    self.Name = newIframeElement.name;
    self.AfterResizeEventHandler = fireAfterResizeEvents;
    self.currentHeight = parseInt(-1);
    self.pollingTime = 100;

    self.initialize = function() {
        self.resize();
        self.Interval = window.setInterval(self.resize, self.pollingTime);
    };

    self.resize = function() {
        var cookieHeight = getHeightFromCookie();
        if (cookieHeight != null) {
            var new_height = parseInt(cookieHeight);
            if (self.currentHeight != new_height) {
                if (self.currentHeight > new_height - 10 && self.currentHeight < new_height + 10) {
                    return false;
                }

                self.iframeElement.height = new_height;
                self.currentHeight = new_height;

                if (self.AfterResizeEventHandler != null) {
                    self.AfterResizeEventHandler();
                }
                return true;
            }
        }
        return false;
    };

    self.stopListening = function() {
        window.clearInterval(self.Interval);
    };

    /* gets the height from the cookie */
    function getHeightFromCookie() {
        var cookie_name = ('dyniframe_' + self.Name.match('dyniframe_(.*?)_http')[1]).toLowerCase();
        var results = document.cookie.match(cookie_name + '=(.*?)(;|$)');
        if (results)
            return (unescape(results[1]));
        else
            return null;
    };
};

function BackWardsCompatibleListener(name, localListener, cookieListener) {
    var self = this;
    self.Name = name;
    self.LocalListener = localListener;
    self.CookieListener = cookieListener;

    self.initialize = function() {
        self.LocalListener.initialize(self);
        self.CookieListener.initialize();
    };

    self.stopCookieListener = function() {
        self.CookieListener.stopListening();
    };

    self.resize = function(new_height) {
        return self.LocalListener.resize(new_height);
    };

    self.hasUrl = function(guid, doc_href) {
        return self.LocalListener.hasUrl(guid, doc_href);
    };

    self.hasName = function(name) {
        return self.Name == name;
    };
};

/* This class does static resizing to the height of the window. (not used much, i think) */
function StaticResizeListener(newIframeElement, fireAfterResizeEvents) {
    var self = this;
    self.iframeElement = newIframeElement;
    self.AfterResizeEventHandler = fireAfterResizeEvents;
    self.currentHeight = parseInt(-1);
    self.pollingTime = 500;

    self.initialize = function() {
        self.resize();
        window.setInterval(self.resize, self.pollingTime);
    };

    self.resize = function() {
        var new_height = parseInt(newHeight());

        if (self.currentHeight != new_height) {
            if (self.currentHeight > new_height - 10 && self.currentHeight < new_height + 10) {
                return false;
            }

            self.iframeElement.height = new_height;
            self.currentHeight = new_height;

            if (self.AfterResizeEventHandler != null) {
                self.AfterResizeEventHandler();
            }
            return true;
        }
        return false;
    };

    /* gets the height the iframe should be */
    function newHeight() {
        var top = 0;

        var pElement = self.iframeElement;
        while (pElement != document.body && pElement) {

            var clientTop = (pElement.offsetHeight - pElement.clientHeight) / 2;

            top += pElement.offsetTop + clientTop;

            try {
                pElement = pElement.offsetParent;
            } catch (e) {
                pElement = null;
            }
        }

        return getBrowserHeight() - top;
    }

    /* Gets the browser height, this gave the best result. Not pixel perfect */
    function getBrowserHeight() {
        var h = null;
        if (document.innerHeight) {
            h = document.innerHeight;
        }
        else if (document.documentElement.clientHeight) {
            h = document.documentElement.clientHeight;
        }
        else if (document.body) {
            h = document.body.clientHeight;
        }

        return h;
    };
};

/*  The IFrameManager is the main motor of the resize scripts. You register the iframe there an 
he starts the listeners
*/
function IFrameManager() {
    var self = this;
    self.listenerCollection = new Array();
    self.afterResizeEvents = new Array();
    self.afterResizeEventsArguments = new Array();

    self.register = function(element, type) {
        self.removeListenerByName(element.name);
        var listener = createListener(element, type);
        self.listenerCollection.push(listener);
        listener.initialize();
    };

    /* add after resize events, these methods are called when a resize is performed */
    self.registerAfterResizeEvents = function(func, object) {
        self.afterResizeEvents.push(func);
        self.afterResizeEventsArguments.push(object);
    };

    /* Gets the listener by href, used by the client script */
    self.getListenerByHref = function(guid, doc_href) {
        var i = null;
        for (i in self.listenerCollection) {
            if (self.listenerCollection[i].hasUrl) {
                if (self.listenerCollection[i].hasUrl(guid, doc_href)) {
                    return self.listenerCollection[i];
                }
            }
        }
    };

    self.removeListenerByName = function(name) {
        var i = null;
        for (i in self.listenerCollection) {
            if (self.listenerCollection[i].hasName) {
                if (self.listenerCollection[i].hasName(name)) {
                    self.listenerCollection.splice(i, 1);
                }
            }
        }
    };

    /* Fires the after resize events */
    function fireAfterResizeEvents() {
        for (var i = self.afterResizeEvents.length - 1; i >= 0; i--) {
            if (self.afterResizeEventsArguments[i] == null)
                self.afterResizeEvents[i]();
            else
                self.afterResizeEvents[i](self.afterResizeEventsArguments[i]);
        }
    }

    /* Gets the right resizer */
    function createListener(iframeElement, type) {
        if (type == "Static") {
            return new StaticResizeListener(iframeElement, fireAfterResizeEvents);
        } else if (window.postMessage) {
            return new MessageEventResizeListener(iframeElement, fireAfterResizeEvents);
        } else {
            return new BackWardsCompatibleListener(iframeElement.name,
                new InterframeResizeListener(iframeElement, fireAfterResizeEvents),
                new CookieResizeListener(iframeElement, fireAfterResizeEvents));
        }
    };
};

//allways set to window.IFrameManager
window.IFrameManager = new IFrameManager();

/* Depricated variable
* This variable makes sure that 'siteIframes.register(this,'Dynamic');' and 
* 'siteIframes.registerAfterResizeEvents(changeHeightClear);' still work
*/
window.siteIframes = window.IFrameManager;

/* Depricated method
* This class makes sure that 'var siteIframes = new IFrames.iframes();' still works
*/
var IFrames =
{
    iframes: function() {
        return window.IFrameManager;
    }
};