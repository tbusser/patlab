/*  Dynamic iframe resizing. This script works with dyframe_host.js on the server to resize 
iframes to the size of its content.
We know multiple ways to do this. The scripts selects the best way to do this. 
The options are: postMessage API (IE8/FF3/Opera9/Safari4?), inter iframe communication 
(on local pages (or subdomain pages) for older browsers, cross domain communication throught 
the server by cookie, when inter face communication isn't possible and we have static frame resizing. 
This is resizing to the window height */

/* This is the default URL for height reporting to server 'http://hosturl/'+dyframe_registerheight+'?sid=..' */
window.ReportingServerPath = 'Medicinfo.Services.DynamicIframeResizing/registerheight.djs';

/* This class reports the height of the content through the postMessage API 
(IE8/FF3/Opera9/Safari4?) */
function MessageHeightReporter() {
    var self = this;
    self.currentHeight = parseInt(-1);
    self.pollingTime = 100;

    self.initialize = function() {
        self.registerResponseListener();
        window.setInterval(self.sendHeight, self.pollingTime);
    };

    self.sendHeight = function() {
        var newHeight = HeightManager.getHeight();
        if (self.currentHeight != newHeight) {
            //send message to host, we add the iframe guid for correlation on the host
            var message = newHeight.toString() + '_' + window.name.split('_')[1].toString();
            var targetOrigin = window.name.split('_')[2].toString();
            //if the targetOrigin contains JSON the the Livecom script has changed the iframe name
            var liveComScriptStart = targetOrigin.indexOf('{"');
            if (liveComScriptStart != -1) {
                //be sure to remove the JSON added by Livecom so we have the original iframe name
                targetOrigin = targetOrigin.substr(0, liveComScriptStart);
            }

            window.parent.postMessage(message, targetOrigin);
        }
    };

    self.registerResponseListener = function() {
        if (window.addEventListener) {
            window.addEventListener("message", self.messageReceived, false);
        } else {
            window.attachEvent("onmessage", self.messageReceived);
        }
    }

    /*  When the host receives the height and sets the iframe height, it sends the height 
    back to the client. Now we can stop sending height */
    self.messageReceived = function(e) {
        self.currentHeight = parseInt(e.data);
    }
};

/*  This class sends the height of the iframe through inter iframe communication. This only 
works for local pages */
function LocalHeightReporter() {
    var self = this;
    self.currentHeight = parseInt(-1);
    self.pollingTime = 100;

    self.initialize = function() {
        IFrameManagerClient.SetDocumentDomainToRoot();
        self.sendHeight();
        window.setInterval(self.sendHeight, self.pollingTime);
    };

    self.sendHeight = function() {
        var newHeight = HeightManager.getHeight();
        if (self.currentHeight != newHeight) {
            if (reportHeightThroughIframe(newHeight)) {
                self.currentHeight = newHeight;
            }
        }
    };

    /*  This function selects the iframe by the current URL (through a function on the host(
    and resizes it. */
    function reportHeightThroughIframe(newHeight) {
        var currentIframe = null;
        try {
            if (window.parent != null && window.parent.IFrameManager != null) {
                currentIframe = window.parent.IFrameManager.getListenerByHref(window.name.split('_')[1], document.location.href);
                if (currentIframe != null) {
                    return currentIframe.resize(newHeight);
                }
            }
        } catch (e) {
            /*  the host may not be ready setting the document.domain, so if an exception 
            happens we keep trying*/
            return false;
        }
        return false;
    };
};

/*  This class sends the height of the iframe to the server, there a cookie is set on the host
domain. This function is only used when local communication isn't possible. This is when
pages are on other domains, or when pages are http and https */
function RemoteHeightReporter() {
    var self = this;
    self.currentHeight = parseInt(-1);
    self.pollingTime = 1000;

    self.initialize = function() {
        self.sendHeight();
        window.setInterval(self.sendHeight, self.pollingTime);
    };

    self.sendHeight = function() {
        var newHeight = HeightManager.getHeight();
        if (self.currentHeight != newHeight) {
            reportHeightToServer(newHeight);
            self.currentHeight = newHeight;
        }
    };

    /* this function sends the height to the server */
    function reportHeightToServer(new_height) {
        /* create script tag and report height of page */
        var remoteScript = document.createElement('script');
        /* build url we want to get */
        var targetOrigin = window.name;
        //if the targetOrigin contains JSON the the Livecom script has changed the iframe name
        var liveComScriptStart = targetOrigin.indexOf('{"');
        if (liveComScriptStart != -1) {
            //be sure to remove the JSON added by Livecom so we have the original iframe name
            targetOrigin = targetOrigin.substr(0, liveComScriptStart);
        }
        var remoteScriptName = targetOrigin.split('_')[2] + '/' + window.ReportingServerPath + '?sid=' + targetOrigin.match('dyniframe_(.*?)_http')[1] + '&height=' + new_height;
        remoteScript.id = 'rs';
        remoteScript.setAttribute('type', 'text/javascript');
        remoteScript.setAttribute('src', remoteScriptName);
        var hd = document.getElementsByTagName('body')[0];

        /* attach script tag and send height by triggering a get request */
        hd.appendChild(remoteScript);
    };
};

/* The IFrameManagerClient selects the method to send information and initializes everything */
function IFrameManagerClient() {
    var self = this;

    self.initialize = function() {
        if (isPageLoadedInIframe() && notAStaticIFrame()) {
            cleanupHTMLPage();
            var reporter = getReporter();
            reporter.initialize();
        }
    };

    /* Select reporter function. See top of the file for more information about when what 
    class is used */
    function getReporter() {
        if (window.postMessage) {
            return new MessageHeightReporter();
        } else if (canUseLocalReporter()) {
            return new LocalHeightReporter();
        } else {
            return new RemoteHeightReporter();
        }
    };

    /* Checks if the pages is loaded in an iframe. */
    function isPageLoadedInIframe() {
        try {
            var parentdoc = window.parent.document;
            if (parentdoc == window.document) {
                return false;
            }
            return true;
        } catch (e) {
            return true;
        }
    };

    /*  trys to find out if the host uses static resizing. This is not 100%, so improvement 
    are a good thing. We check now if a url is added to the window name, if not
    RemoteHeightReporter will crash, so we kill this */
    function notAStaticIFrame() {
        if (window.name.split('_').length == 3) {
            return true;
        }
        return false;
    };

    /* this method checks if we can use local reporting */
    function canUseLocalReporter() {
        //get the host url
        var targetOrigin = window.name;
        //if the targetOrigin contains JSON the the Livecom script has changed the iframe name
        var liveComScriptStart = targetOrigin.indexOf('{"');
        if (liveComScriptStart != -1) {
            //be sure to remove the JSON added by Livecom so we have the original iframe name
            targetOrigin = targetOrigin.substr(0, liveComScriptStart);
        }
        var hostUrl = targetOrigin.split('_')[2];
        if (hostUrl != null) {
            if (document.domain.indexOf('.') != -1 && hostUrl.indexOf('.') != -1) {
                var hostUrlItems = hostUrl.split('/');
                //are protocols equal?
                if (document.location.protocol == hostUrlItems[0]) {
                    //are hosts equal
                    if (document.location.host == hostUrlItems[2]) {
                        return true;
                    }
                    var domainItems = document.domain.split('.');
                    var hostUrlItems = hostUrlItems[2].split('.');
                    var domainRoot = domainItems[domainItems.length - 2] + '.' + domainItems[domainItems.length - 1];
                    var hostRoot = hostUrlItems[hostUrlItems.length - 2] + '.' + hostUrlItems[hostUrlItems.length - 1];
                    //are root hosts equal
                    if (domainRoot == hostRoot) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    /* Checks if the host and client page are on the same domain */
    function isLocal() {
        try {
            /* if the iframe is cross domain, null has to be return, with domain we 
            force a security exception */
            var pathDoc = window.parent.document.location.pathname;
            return true;
        }
        catch (e) {
            return false;
        };
    };

    /* Sets the document.domain property to the root domain */
    self.SetDocumentDomainToRoot = function() {
        if (document.domain.indexOf('.') != -1) {
            var domainItems = document.domain.split('.');
            try {
                document.domain = domainItems[domainItems.length - 2] + '.' + domainItems[domainItems.length - 1];
            } catch (exc) { }
        }
    };

    function cleanupHTMLPage() {
        //body of page
        var bodyElement = window.document.body;
        var htmlElement = window.document.documentElement;

        //We remove default padding and margin in some cases, if you override it
        //in you code you have no problem. 
        if (!bodyElement.style.marginTop) {
            bodyElement.style.marginTop = "0px";
        }

        if (!bodyElement.style.marginBottom) {
            bodyElement.style.marginBottom = "0px";
        }

        if (!bodyElement.style.paddingTop) {
            bodyElement.style.paddingTop = "0px";
        }

        if (!bodyElement.style.paddingBottom) {
            bodyElement.style.paddingBottom = "0px";
        }

        //set overflow hidden on body; This corrects padding and margin problems when measuring
        //the height
        bodyElement.style.overflow = "hidden";
        htmlElement.style.overflow = "hidden";
    }
};

function HeightManager() {
    /* This mehtod trys to get the height of the content.
    But this is not an exact science. It turns out this is very hard to do. 
    This seems to be the best result in all cases */
    this.getHeight = function() {
        if (document.compatMode == "CSS1Compat") {
            return HeightManager.getCSS1CompatHeight();
        } else {
            return HeightManager.getBackCompatHeight();
        }
    };

    this.getBackCompatHeight = function() {
        var new_height = parseInt(document.body.scrollHeight);
        return new_height;
    };
 
    this.getCSS1CompatHeight = function() {
        //body of page
        var bodyElement = window.document.body;

        //Getting margin and padding values for later use
        //We also remove default padding and margin in some cases, if you override it
        //in you code you have no problem. 
        var marginTop = 0;

        if (bodyElement.style.marginTop) {
            marginTop = bodyElement.style.marginTop;
        }

        var marginBottom = 0;
        if (bodyElement.style.marginBottom) {
            marginBottom = bodyElement.style.marginBottom;
        }

        var paddingTop = 0;
        if (bodyElement.style.paddingTop) {
            paddingTop = bodyElement.style.paddingTop;
        }

        var paddingBottom = 0;
        if (bodyElement.style.paddingBottom) {
            paddingBottom = bodyElement.style.paddingBottom;
        }

        /*  The offsetHeight is the height of the content in the body tag 
        but padding and margin of the html and body tag are ignored. 
        All browsers have default padding op top, so we need to check this */
        return parseInt(document.body.offsetHeight) +
                parseInt(marginTop) +
                parseInt(marginBottom) +
                parseInt(paddingTop) +
                parseInt(paddingBottom);
    };
};

/* Create instances of the heightManager and IFrameManager client */
window.HeightManager = new HeightManager();
window.IFrameManagerClient = new IFrameManagerClient();

/* This starts the process off, the is onload of the page, we initialize the IFrameManagerClient */
if (window.addEventListener) {
    window.addEventListener("load", window.IFrameManagerClient.initialize, false);
} else {
    window.attachEvent("onload", window.IFrameManagerClient.initialize);
}

/* This function is not run onload anymore, but can still be used */
function setHeadDomain() {
    try {
        if (!window.postMessage) {
            // The post message API is not available (not IE8 or FF3)
            // Set the document to the root domain
            var domainItems = document.domain.split('.');
            if (domainItems.length > 1) {
                document.domain = domainItems[domainItems.length - 2] + '.' + domainItems[domainItems.length - 1];
            }
        }
    } catch (e) {
        // Swallow errors
    }
}
setHeadDomain();
    
/* This function is here for backwards compatibility, do not call this function anymore! */
function registerheight() { }
