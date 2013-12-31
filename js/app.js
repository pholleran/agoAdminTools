define([
	"dojo/Deferred",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/Evented",
	"dojo/html",
	"dojo/on",
	"dojo/request/xhr",
	
	"dijit/registry",
	
	"dijit/layout/ContentPane",
	"dijit/layout/TabContainer",

	"esri/IdentityManager",
	"esri/arcgis/Portal",
	"esri/map",
	
], function(Deferred,dom,domAttr,domClass,Evented,html,on,xhr,registry,ContentPane,TabContainer,IdentityManager,esriPortal,map){

	var currentPortal;

	function logIn(){
		currentPortal = new esriPortal.Portal(registry.byId("portalInput").get("value"));

		on(esri.id, "dialog-cancel", function(info){
			registry.byId("portalInput").set("value", "https://www.arcgis.com");
		});

		currentPortal.signIn().then(function(loggedInUser){
			console.log(loggedInUser);
			if (loggedInUser.role != 'org_admin') {
				alert("You must be an administrator in your org to use this tool.");
				portal.signOut();
			}
			else {
				startSession(loggedInUser);
			}
		})
	}
	
	function startSession(loggedInUser){
		// Activate Tasks Button
		registry.byId("taskButton").set("disabled",false);
		registry.byId("portalInput").set("disabled", true);

		sessionStorage.setItem("userName", loggedInUser.username);
		sessionStorage.setItem("token", loggedInUser.credential.token);
		sessionStorage.setItem("portalID", loggedInUser.portal.id);
		sessionStorage.setItem("portalUrl", loggedInUser.portal.portalUrl);
		sessionStorage.setItem("urlKey", loggedInUser.portal.urlKey);
		// sessionStorage.setItem("defaultBasemap", JSON.stringify(loggedInUser.portal.defaultBasemap));
		// sessionStorage.setItem("defaultExtent", JSON.stringify(loggedInUser.portal.defaultExtent));
	
		// Change button to logOut State
		registry.byId("loginButton").set("label","Log Out");
		registry.byId("loginButton").set("onClick", function(){logOut()});
		dom.byId("orgName").innerHTML = currentPortal.name;
		dom.byId("siteTitle").innerHTML = "AGO Admin Tools (BETA): " + currentPortal.name;

	}

	function logOut(){
		sessionStorage.clear;
		currentPortal.signOut();

		// destroy all open tabs
		var tabContainer = registry.byId("tabContainer");
		tabContainer.destroyDescendants();
		makeMainTab();
		
		// Change titles and labels
		dom.byId("orgName").innerHTML = "";	
		registry.byId("loginButton").set("label","Log In");
		registry.byId("loginButton").set("onClick", function(){logIn();});
		registry.byId("portalInput").set("disabled", false);

		// Disable the Tasks Button
		registry.byId("taskButton").set("disabled",true);
	}
	
	// Create the main tab for the tab container
	function makeMainTab(){
		var mainTab = new ContentPane({
    		id: "mainTab",
			href: "./custom/templates/mainTab.html",
			title: "Welcome",
			closable: false,
			selected: true,
		});
		
		var tc = registry.byId("tabContainer");	
		tc.addChild(mainTab,0);
	}
	
	// Programmatically make a tab for the TabContainer
	function makeTab(tabId,title,content){
			
		// check DOM to see if tab exists
		var tabContainer = registry.byId("tabContainer");
		var tab = registry.byId(tabId);
		var children = tabContainer.getChildren();
		var countChildren = children.length;
		
		// if tab does not extst, create it
		if(tab == null){
			
			// create index value for insertion
			var index;
			
			if(countChildren == null){
				index = 0;
			}
			else{
				index = countChildren;
			}

			var addTab = new ContentPane({
				id: tabId,
				href: content,
				// content: content,
				title: title,
				closable: true,
				selected: true,
			});
			tabContainer.addChild(addTab,index);
			tabContainer.selectChild(addTab);
		}
		
		// if tab already exists, focus on it
		else {
			tabContainer.selectChild(tabId);
		}
	}

	// Show the Busy Div
	function showBusy(){
		domClass.remove("busyDiv", "hidden");
	}
	
	//Show the loading image
	function showLoader(){
		domClass.remove("loaderDiv", "hidden");
	}
	
	// Hide the Busy Div
	function hideBusy(){
		domClass.add("busyDiv", "hidden");
	}
	
	// Hide the laoder
	function hideLoader(){
		domClass.add("loaderDiv", "hidden");
	}
	
	// Return Object Exposing Functions
	return {
		logIn: logIn,
		startSession: startSession,
		logOut: logOut,
		makeMainTab: makeMainTab,
		makeTab: makeTab,
		showBusy: showBusy,
		showLoader: showLoader,
		hideBusy: hideBusy,
		hideLoader: hideLoader,
	}
})
