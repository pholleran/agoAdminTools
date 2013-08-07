require([
	"dojo/dom",
	"dojo/dom-attr",

	"dojo/_base/window",
	
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/form/Form",
	"dijit/layout/StackContainer",
	"dijit/layout/TabContainer",
	
	"dijit/Dialog",
	"dijit/Menu",
	"dijit/MenuBar",
	"dijit/MenuItem",
	"dijit/registry",
	
	"dijit/form/Button",
	"dijit/form/ComboButton",
	"dijit/form/Form",
	"dijit/form/TextBox",
	
	"dojo/dom-construct",
	
	"dojox/widget/DialogSimple",
	
	"js/app",
	
	"dojo/domReady!",
	
	],function(dom,
		domAttr,
		win,
		BorderContainer,
		ContentPane,
		Form,
		StackContainer,
		TabContainer,
		Dialog,
		Menu,
		MenuBar,
		MenuItem,
		registry,
		Button,
		ComboButton,
		Form,
		TextBox,
		domConstruct,
		DialogSimple,
		app){
		
		/* Create Alert Dialog
		var alertDialog = new DialogSimple({
			id: "alertDialog",
			title: "Alert",
			href:"custom/templates/alertTemplate.html",
			executeScripts: true,
			style: "width: 300px;"
		});
		alertDialog.startup();
		*/

		var progressDialog = new DialogSimple({
			id: "progressDialog",
			title: "Progress",
			href:"custom/templates/progressTemplate.html",
			executeScripts: true,
			style: "width: 300px;"
		});
		progressDialog.startup();
		
    	// Main Container
    	var mainContainer = new BorderContainer({
    		id: "mainContainer",
    		region: "center",
    		design: "headline",
    		gutters: false,
    		class: "fullHeight fullWidth",
    		style: "background-color: white;",
    	},"bcDiv");	
    	
    		// Title Pane
    		var titlePane = new ContentPane({
    			id: "titlePane",
    			region: "top",
    			class: "fullWidth",
    			style: "background-color: white;",        			
    		});
    		mainContainer.addChild(titlePane);
    	
    		// Tab Pane
    		var tabPane = new ContentPane({
    			id: "tabPane",
    			region: "center",
    			class: "fullWidth",
    			style: "background-color: red",
    		});
    		mainContainer.addChild(tabPane);

        // Build the TabContainer and Insert into ContnetPane
		var tabContainer = new TabContainer({
			id: "tabContainer",
			class: "",
			style: "height:50%;background-color: #E8E8E8; padding:5px; padding-right: 5px",
		});
		
		tabContainer.startup();
		tabPane.set("content",tabContainer);

        // Build the Menu DIV and Insert into the ContentPane
        domConstruct.place("<div id='foo' style='background-color:white'  class='title margin10'>AGO Admin Tools (BETA): <span id='orgName' style='color: #4d4d4d;'></span></div><div id='menuDiv' class='margin10l margin 10b' style='background-color:white'></div>","titlePane","last");
        
        // Build the Combo Button and insert into the Menu DIV
        var taskMenu = new Menu ({
        	id: "taskMenu",
        	style: "display: none",
        });
        
        // Build and Add the MenuItems for the ComboButton
        var extentItem = new MenuItem({
        	id: "extentItem",
        	label: "Change Default Map Extent",
        	onClick: function(){app.makeTab("extentTab","Change Map Extent","./custom/templates/mapTab.html")},
        });
        taskMenu.addChild(extentItem);
        
        var shortUrlItem = new MenuItem({
        	id: "shortUrlItem",
        	label: "Change URL Key",
        	onClick: function(){app.makeTab("shortUrlTab","Change URL Key","./custom/templates/shortUrlTab.html")},
        });
        taskMenu.addChild(shortUrlItem);
        
        /*
        var serverNameItem = new MenuItem({
        	id: "serverNameItem",
        	label: "Update Server/Service Path",
        	onClick: function(){app.makeTab("serverNameTab","Update Server/Service Path","./custom/templates/updateServerNameTab.html")},
        });
        taskMenu.addChild(serverNameItem);
	*/
        /*
        var eMailItem = new MenuItem({
        	id: "eMailItem",
        	label: "Send e-Mail",
        	onClick: function(){app.makeTab("eMailTab","Send E-Mail","./custom/templates/eMailTab.html")},
        });
        taskMenu.addChild(eMailItem);
        */
        
        var taskButton = new ComboButton({
        	id: "taskButton",
        	label: "Tasks",
        	disabled: true,
        	dropDown: taskMenu,
        })  
        taskButton.placeAt("menuDiv");

        // Build and place the Poral URL TextBox Span
        domConstruct.place("<label for='portalInput' class='text' style='padding-left: 8px;padding-right: 4px'>Portal:</label>","menuDiv", "last");
        var portalInput = new TextBox({
            id: "portalInput",
            title: " Portal URL: ",
            class: "text",
            value: "http://www.arcgis.com"
        })
        portalInput.placeAt("menuDiv");

        // Build and place the Login Button
        var loginButton = new Button({
            id: "loginButton",
            label: "Log In",
            onClick: function(){app.logIn()},
        });
        loginButton.placeAt("menuDiv");
        
        mainContainer.startup();
        app.makeMainTab();

		return {
		}
	}
)
