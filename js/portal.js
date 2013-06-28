define([
    "dijit/registry",

    "dojo/_base/array",
    "dojo/Deferred",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/request/xhr",
    "dojo/regexp",

    "js/app"

], function(registry, array, Deferred, dom, domAttr, domStyle, xhr, regexp, app) {

    // function to get list of all users and desired properties
    // accepts an array [userProperties], which must be formatted as
    // ["property1","property2"]
    function getUserInfos(userProperties) {
        
        var getUserInfosDeferred = new Deferred();
        var userInfos = [];
        var numUsers = String(100);
        var position = String(1);
        var url = sessionStorage.getItem("portalUrl") + "portals/" + sessionStorage.getItem("portalID") + "/users?f=pjson" + 
            "&num=" + numUsers + "&start=" + position + "&token=" + sessionStorage.getItem("token");

        xhr(url, {
            preventCache: true,
            handleAs: "json",
            headers: {
                "X-Requested-With": ""
            }
        }).then(function(response){
            for (var i=0; i< response.users.length; i++){
                // create user object
                var user = {};
                var obj = response.users[i];
                for(var p = 0; p < userProperties.length; p++){
                    // append property to user object
                    var property = userProperties[p];
                    var value = obj[property];
                    user[property] = value;
                }   
                userInfos.push(user);
            }
            if (response.nextStart == -1){
               getUserInfosDeferred.resolve(userInfos);
            }
            else {
                var startNum = response.nextStart;
                getUsersAndAppendInfos(100,startNum,userProperties);
            }
        })
        return getUserInfosDeferred.promise;
    }

    // function to update the urlKey (short URL) of a hosted organization
    // org path = http://<urlKey>.maps.arcgis.com
    // re-pathing of hosted application URLs to new key now appears to happen server-side
    function updateShortUrl(){
        app.showBusy();
        app.showLoader();

        var newKey = (registry.byId("newShortUrl").get("value"));
        var postData = {'urlkey': newKey};
        var url = sessionStorage.getItem("portalUrl") + "portals/" + sessionStorage.getItem("portalID") + "/update?f=pjson&token=" + sessionStorage.getItem("token");

        xhr.post(url,{
            data: postData,
            preventCache: true,
            sync: false,
            handleAs: "json",
            headers: {
                "X-Requested-With": "",
            },
        }).then(function(response){
            if(response.success == true){
                sessionStorage.setItem("urlKey",newKey);
                registry.byId("newShortUrl").set("value","");
                dom.byId("currentShortUrlSpan").innerHTML = newKey;
                app.hideLoader();
                alert("success");
                app.hideBusy();
            }
            else{
                app.hideLoader();
                alert("Error: "+response.error.message);
                registry.byId("newShortUrl").set("value","");
                app.hideBusy();
            }
        }); 
    }

    // a function that updates URL references for all items belonging to the input users
    // accepts users as an array of usernames in the org, oldPath as the old URL path, and newPath as the replacement
    function updateAllItemURLs(users, oldPath, newPath){
        var updateAllItemURLsDeferred = new Deferred();

        var urlBasedItems = ['Feature Service', 'Map Service', 'Image Service', 'Web Mapping Application',
            'WMS','WMTS', 'Geodata Service', 'Globe Service','Geometry Service', 'Geocoding Service',
            'Network Analysis Service', 'Geoprocessing Service','Mobile Application', 'url', 'Document Link']
        var pattern = new RegExp(regexp.escapeString(oldPath));
        var usersCompleted = 0;
        var dialog = registry.byId("progressDialog");
        dom.byId("userProgressText").innerHTML = "Users: " + usersCompleted + " of " + users.length + "completed";

        for (var u = 0; u < users.length; u++){
            processUser(users[u].username).then(function(response){
                incAndTest()
            })
        }

        // function to increment users and test for completion
        function incAndTest(){
            usersCompleted++;
            dom.byId("userProgressText").innerHTML = "Users: " + usersCompleted + " of " + users.length + " completed";
            if(usersCompleted == users.length){
                dom.byId("userProgressText").innerHTML = "Update Completed";
                registry.byId("dialogButton").set("label", "OK");
                registry.byId("dialogButton").set("disabled", false);

                updateAllItemURLsDeferred.resolve();
            }
        }

        // function to iterate through all content owned by user
        function processUser(user){
            var puDef = new Deferred();
            var usrBaseURL = sessionStorage.getItem("portalUrl") + "content/users/" + user;
            var usrReqURL = usrBaseURL + "?f=pjson&token=" + sessionStorage.getItem("token");
            var rootComplete = false;

            xhr(usrReqURL, {
                handleAs: "json",
                preventCache: true,
                sync: true,
                headers: {"X-Requested-With": ""},
                timeout: 3000,
            }).then(function(response){
                // check for content
                if (response.items.length > 0 || response.folders.length > 0){

                    // iterate over root
                    if (response.items.length > 0){
                        processItems(response.items, user).then(function(response){
                            rootComplete = true;
                        });
                    }
                    // iterate over folders
                    if (response.folders.length > 0){
                        var fldrsComplete = 0;

                        function fldrTest(){
                            fldrsComplete++;
                            dom.byId("folderProgressText").innerHTML = "&nbsp;&nbsp; User Folders: " + fldrsComplete + " of " + response.folders.length + " completed";
                            if (fldrsComplete == response.folders.length){
                                dom.byId("folderProgressText").innerHTML = "&nbsp;&nbsp; User Folders:";
                                puDef.resolve();
                            }
                        }

                        for(var f = 0; f < response.folders.length; f++){
                            processFolder(response.folders[f].id, user).then(function(response){
                                fldrTest();
                            })
                        }
                    }
                    else {
                        puDef.resolve();
                    }          
                }
                else {
                    puDef.resolve();
                }
            })
            
            function processItems(items, user, folderId) {
                var piDef = new Deferred();
                var itmsComplete = 0;

                for (var i = 0; i < items.length; i++){
                    // test if item is URL based
                    if (array.indexOf(urlBasedItems, items[i].type) != -1) {
                        // perform update XHR then decrement remaining items and test for more
                        if (pattern.test(items[i].url)) {
                            var newURL = items[i].url.replace(oldPath, newPath);
                            urlData = {'url': newURL};
                            updateURLbasedItem(items[i].id, user, urlData, folderId).then(function(results){
                                itmTest();
                            })                          
                        }
                        else {
                            itmTest();
                        }
                    }
                    // Test if Item is Web Map
                    if (items[i].type == "Web Map"){
                        processWebMap(items[i].id, user, folderId).then(function(results){
                            itmTest();   
                        });
                    }
                    // Handle other Item Types
                    if (items[i].type != "Web Map" & array.indexOf(urlBasedItems, items[i].type) == -1) {
                        itmTest();
                    }
                }

                function itmTest(){
                    itmsComplete = itmsComplete + 1;
                    dom.byId("itemProgressText").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp; Folder Items: " + itmsComplete + " of " + items.length + " completed";
                    if(itmsComplete == items.length){
                        dom.byId("itemProgressText").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp; Folder Items: ";
                        piDef.resolve();
                    }
                }

                return piDef.promise;
            }

            // function to handle the processing and updating of URLs in webmaps
            function processWebMap (webMapId, user, folderId) {
                var procWebMapDef = new Deferred();
                var webmapURL = sessionStorage.getItem("portalUrl") + "content/items/" + webMapId + "/data"
                + "?token=" + sessionStorage.getItem("token");
                // retrieve the webMap data
                xhr(webmapURL, {
                    preventCache: true,
                    sync: true,
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": ""
                    }
                }).then(function(data){

                    var wmRespDef = new Deferred();
                    var webMapData = data;
                    var opLyrsComplete = 0;
                    var bsLyrsComplete = 0;
                    var updateNeeded = false;

                    // iterate through operational layers
                    for (var ol = 0; ol < webMapData.operationalLayers.length; ol++) {
                        if (pattern.test(webMapData.operationalLayers[ol].url)) {                   
                            webMapData.operationalLayers[ol].url = webMapData.operationalLayers[ol].url.replace(oldPath, newPath);
                            updateNeeded = true;
                        }
                        opLyrsComplete = opLyrsComplete + 1;

                        if (opLyrsComplete == webMapData.operationalLayers.length & bsLyrsComplete == webMapData.baseMap.baseMapLayers.length){
                            if (updateNeeded == true) {
                                updateWebMapData(webMapId, user, webMapData, folderId).then(function(response){
                                    wmRespDef.resolve();
                                })
                            }
                            else {
                                wmRespDef.resolve();
                            }
                        }
                    }

                    // iterate through basemap layers
                    for (var bl = 0; bl < webMapData.baseMap.baseMapLayers.length; bl++){
                        if (pattern.test(webMapData.baseMap.baseMapLayers[bl].url)) {
                            webMapData.baseMap.baseMapLayers[bl].url = webMapData.baseMap.baseMapLayers[bl].url.replace(oldPath, newPath);
                            updateNeeded = true;
                        }
                        bsLyrsComplete = bsLyrsComplete + 1;
                        if (opLyrsComplete == webMapData.operationalLayers.length & bsLyrsComplete == webMapData.baseMap.baseMapLayers.length){
                            if (updateNeeded == true) {
                                updateWebMapData(webMapId, user, webMapData, folderId).then(function(response){
                                    wmRespDef.resolve();
                                })
                            }
                            else {
                                wmRespDef.resolve();
                            }
                        }
                    }
                    return wmRespDef.promise;
                }).then(function(response){
                    procWebMapDef.resolve();
                })
                return procWebMapDef.promise;
            }

            // retrieves items from a folder and passes the result to the processItems function
            function processFolder (folderId, user) {
                var pfDef = new Deferred();
                var fldrUrl = usrBaseURL + "/" + folderId + "?f=pjson&token=" + sessionStorage.getItem("token");   
                xhr(fldrUrl, {
                    handleAs: "json",
                    preventCache: true,
                    sync: true,
                    headers: {"X-Requested-With": ""},
                    timeout: 3000,
                }).then(function(response){
                    // test for items in folder
                    if (response.items.length > 0){
                        processItems(response.items, user, folderId).then(function(response){
                            pfDef.resolve();
                        })
                    }
                    else {
                        pfDef.resolve();
                    }
                })
                return pfDef.promise;
            }

            return puDef.promise;
        }

        return updateAllItemURLsDeferred.promise;
    }

    // function to update the webmap JSON.  Takes an optional argument to pass if the calling
    function updateWebMapData(webMapItemId, user, webMapData, folderId) {  
        var updateWebMapDef = new Deferred();
        var wmUpdateURL;
        if (folderId){
            wmUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/" + folderId + "/items/" + webMapItemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        else{
            wmUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/items/" + webMapItemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        var wmpd = {"text": JSON.stringify(webMapData)};
        
        xhr.post(wmUpdateURL, {
            data: wmpd,
            preventCache: true,
            sync: true,
            handleAs: "json",
            headers: {
                "X-Requested-With": ""
            }
        }).then(function(response){
            updateWebMapDef.resolve();
        })
        return updateWebMapDef.promise; 
    }

    // function to update the URL of a URL-based item
    // acecpts the itemId as a string, owner (user) name as a string, data as an object for the data to be passed in the post
    //     and folderId as an string if the item is within a user folder
    function updateURLbasedItem(itemId, user, data, folderId){
        var updateURLitemDef = new Deferred();
        var itemUpdateURL;
        if (folderId){
            itemUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/" + folderId + "/items/" + itemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        else {
            itemUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/items/" + itemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        
        xhr.post(itemUpdateURL, {
            preventCache: true,
            data: data,
            sync: true,
            handleAs: "json",
            headers: {
                "X-Requested-With": ""
            }
        }).then(function(response){
            updateURLitemDef.resolve();
        })

        //updateURLitemDef.resolve();
        return updateURLitemDef.promise;
    }

    return {
        getUserInfos: getUserInfos,
        updateShortUrl: updateShortUrl,
        updateAllItemURLs: updateAllItemURLs,
    }  
})
        