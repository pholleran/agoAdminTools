define([
    "dijit/registry",

    "dojo/_base/array",
    "dojo/Deferred",
    "dojo/dom",
    "dojo/regexp",

    "esri/request",

    "js/app"

], function (registry, array, Deferred, dom, regexp, esriRequest, app) {

    var vOldPath, vNewPath, pattern, urlBasedItems;

    urlBasedItems = ['Feature Service', 'Map Service', 'Image Service', 'Web Mapping Application',
        'WMS','WMTS', 'Geodata Service', 'Globe Service','Geometry Service', 'Geocoding Service',
        'Network Analysis Service', 'Geoprocessing Service','Mobile Application', 'Document Link'];

    // function to get list of all users and desired properties
    // accepts an array [userProperties], which must be formatted as
    // ["property1","property2"]
    function getUserInfos (userProperties) {
        var getUserInfosDeferred, userInfos, numUsers, position, url, usrInf;

        getUserInfosDeferred = new Deferred();
        userInfos = [];
        numUsers = String(100);
        position = String(1);
        url = sessionStorage.getItem("portalUrl") + "portals/" + sessionStorage.getItem("portalID") + "/users?f=pjson" + 
            "&num=" + numUsers + "&start=" + position + "&token=" + sessionStorage.getItem("token");

        usrInf = new esriRequest({
            url: url,
            handleAs: 'json',
        });

        usrInf.then( function (response) {
            for (var i = 0; i < response.users.length; i++){
                // create user object
                var user, obj;
                user = {};
                obj = response.users[i];
                for(var p = 0; p < userProperties.length; p++){
                    // append property to user object
                    var property, value;
                    property = userProperties[p];
                    value = obj[property];
                    user[property] = value;
                }   
                userInfos.push(user);
            }
            if (response.nextStart === -1){
               getUserInfosDeferred.resolve(userInfos);
            }
            else {
                var startNum = response.nextStart;
                getUsersAndAppendInfos(100,startNum,userProperties);
            }
        });
        return getUserInfosDeferred.promise;
    }

    // function to update the urlKey (short URL) of a hosted organization
    // org path = http://<urlKey>.maps.arcgis.com
    // re-pathing of hosted application URLs to new key now appears to happen server-side
    function updateShortUrl () {
        app.showBusy();
        app.showLoader();

        var newKey, postData, url, updateReq;

        newKey = (registry.byId("newShortUrl").get("value"));
        postData = {'urlkey': newKey};
        url = sessionStorage.getItem("portalUrl") + "portals/" + sessionStorage.getItem("portalID") + "/update?f=pjson&token=" + sessionStorage.getItem("token");

        updateReq = new esriRequest ({
            url: url,
            content: postData,
            handleAs: 'json',
        },{
            usePost: true,
        });         

        updateReq.then(function (response) {
            if (response.success === true){
                sessionStorage.setItem("urlKey",newKey);
                registry.byId("newShortUrl").set("value","");
                dom.byId("currentShortUrlSpan").innerHTML = newKey;
                app.hideLoader();
                alert("success");
                app.hideBusy();
            }
            else {
                app.hideLoader();
                alert("Error: " + response.error.message);
                registry.byId("newShortUrl").set("value","");
                app.hideBusy();
            }
        }); 
    }

    // a function that updates URL references for all items belonging to the input users
    // accepts users as an array of usernames in the org, oldPath as the old URL path, and newPath as the replacement
    function updateAllItemURLs (users, oldPath, newPath) {
        var dialog, usersCompleted, updateAllItemURLsDeferred;

        vOldPath = oldPath;
        vNewPath = newPath;
        updateAllItemURLsDeferred = new Deferred();
        pattern = new RegExp(regexp.escapeString(vOldPath));
        usersCompleted = 0;
        dialog = registry.byId("progressDialog");

        dom.byId("userProgressText").innerHTML = "Users: " + usersCompleted + " of " + users.length + " completed";

        for (var u = 0; u < users.length; u++){
            processUser(users[u].username).then(function (response) {
                incAndTest();
            });
        }

        // function to increment users and test for completion
        function incAndTest () {
            usersCompleted++;
            dom.byId("userProgressText").innerHTML = "Users: " + usersCompleted + " of " + users.length + " completed";
            if(usersCompleted === users.length){
                dom.byId("userProgressText").innerHTML = "Update Completed";
                registry.byId("dialogButton").set("label", "OK");
                registry.byId("dialogButton").set("disabled", false);

                updateAllItemURLsDeferred.resolve();
            }
        }
        return updateAllItemURLsDeferred.promise;
    }

    // function to iterate through all content owned by user
    function processUser (user) {
        var puDef, usrBaseURL, usrReqURL, usrReq, rootComplete;

        puDef = new Deferred();
        usrBaseURL = sessionStorage.getItem("portalUrl") + "content/users/" + user;
        usrReqURL = usrBaseURL + "?f=pjson&token=" + sessionStorage.getItem("token");
        rootComplete = false;

        usrReq = new esriRequest({
            url: usrReqURL,
            handleAs: 'json',
        });

        usrReq.then(function (response) {
            // check for content
            if (response.items.length > 0 || response.folders.length > 0){

                // iterate over root
                if (response.items.length > 0){
                    processItems(response.items, user).then(function (response) {
                        rootComplete = true;
                    });
                }
                // iterate over folders
                if (response.folders.length > 0){
                    var fldrsComplete = 0;

                    function fldrTest () {
                        fldrsComplete++;
                        if (fldrsComplete === response.folders.length){
                            puDef.resolve();
                        }
                    }

                    for(var f = 0; f < response.folders.length; f++){
                        processFolder(response.folders[f].id, user).then(function (response) {
                            fldrTest();
                        });
                    }
                }
                else {
                    puDef.resolve();
                }          
            }
            else {
                puDef.resolve();
            }
        });
        return puDef.promise;
    }

    // function to process items
    function processItems (items, user, folderId) {
        var piDef = new Deferred();
        var itmsComplete = 0;

        for (var i = 0; i < items.length; i++) {
            // test if item is URL based
            if (array.indexOf(urlBasedItems, items[i].type) !== -1) {
                
                // perform update then decrement remaining items and test for more
                if (pattern.test(items[i].url)) {
                    var newURL = items[i].url.replace(vOldPath, vNewPath);
                    urlData = {'url': newURL};
                    updateURLbasedItem(items[i].id, user, urlData, folderId).then(function (results) {
                        itmTest();
                    });                          
                }
                else {
                    itmTest();
                }
            }
            // Test if Item is Web Map
            if (items[i].type === "Web Map"){
                processWebMap(items[i].id, user, folderId).then(function (results) {
                    itmTest();   
                });
            }
            // Handle other Item Types
            if (items[i].type !== "Web Map" && array.indexOf(urlBasedItems, items[i].type) === -1) {
                itmTest();
            }
        }

        function itmTest () {
            itmsComplete = itmsComplete + 1;
            if(itmsComplete === items.length){
                piDef.resolve();
            }
        }

        return piDef.promise;
    }

    // retrieves items from a folder and passes the result to the processItems function
    function processFolder (folderId, user) {
        var pfDef, usrBaseURL, fldrUrl, fldrReq;

        pfDef = new Deferred();
        usrBaseURL = sessionStorage.getItem("portalUrl") + "content/users/" + user;
        fldrUrl = usrBaseURL + "/" + folderId + "?f=pjson&token=" + sessionStorage.getItem("token"); 

        fldrReq = new esriRequest({
            url: fldrUrl,
            handleAs: 'json',
        });

        fldrReq.then(function (folderContents) {
            // test for items in folder
            if (folderContents.items.length > 0){
                processItems(folderContents.items, user, folderId).then(function (response) {
                    pfDef.resolve();
                });
            }
            else {
                pfDef.resolve();
            }
        });
        return pfDef.promise;
    }

    // function to handle the processing and updating of URLs in webmaps
    function processWebMap (webMapId, user, folderId) {
        
        var procWebMapDef, webmapURL, webMapReq;

        procWebMapDef = new Deferred();
        webmapURL = sessionStorage.getItem("portalUrl") + "content/items/" + webMapId + "/data" + "?token=" + sessionStorage.getItem("token");
        
        webMapReq = new esriRequest({
            url: webmapURL,
            handleAs: 'json',
        });

        webMapReq.then(function (data) {

            var bsLyrsComplete, opLyrsComplete, webMapData, wmRespDef, updateNeeded;

            wmRespDef = new Deferred();
            webMapData = data;
            opLyrsComplete = 0;
            bsLyrsComplete = 0;
            updateNeeded = false;

            // iterate through operational layers
            for (var ol = 0; ol < webMapData.operationalLayers.length; ol++) {
                if (pattern.test(webMapData.operationalLayers[ol].url)) {                   
                    webMapData.operationalLayers[ol].url = webMapData.operationalLayers[ol].url.replace(vOldPath, vNewPath);
                    updateNeeded = true;
                }
                opLyrsComplete = opLyrsComplete + 1;

                if (opLyrsComplete === webMapData.operationalLayers.length && bsLyrsComplete === webMapData.baseMap.baseMapLayers.length){
                    if (updateNeeded === true) {
                        updateWebMapData(webMapId, user, webMapData, folderId).then(function (response) {
                            wmRespDef.resolve();
                        });
                    }
                    else {
                        wmRespDef.resolve();
                    }
                }
            }

            // iterate through basemap layers
            for (var bl = 0; bl < webMapData.baseMap.baseMapLayers.length; bl++){
                if (pattern.test(webMapData.baseMap.baseMapLayers[bl].url)) {
                    webMapData.baseMap.baseMapLayers[bl].url = webMapData.baseMap.baseMapLayers[bl].url.replace(vOldPath, vNewPath);
                    updateNeeded = true;
                }
                bsLyrsComplete = bsLyrsComplete + 1;
                if (opLyrsComplete === webMapData.operationalLayers.length && bsLyrsComplete === webMapData.baseMap.baseMapLayers.length){
                    if (updateNeeded === true) {
                        updateWebMapData(webMapId, user, webMapData, folderId).then(function (response) {
                            wmRespDef.resolve();
                        });
                    }
                    else {
                        wmRespDef.resolve();
                    }
                }
            }
            return wmRespDef.promise;
        }).then(function (response) {
            procWebMapDef.resolve();
        });
        return procWebMapDef.promise;
    }

    // function to update the webmap JSON.  Takes an optional argument to pass if the calling
    function updateWebMapData (webMapItemId, user, webMapData, folderId) {  
        
        var updateWebMapDef, wmpd, wmUpdateURL, wmUpdateReq;

        updateWebMapDef = new Deferred();

        if (folderId){
            wmUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/" + folderId + "/items/" + webMapItemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        else{
            wmUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/items/" + webMapItemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        
        wmpd = {"text": JSON.stringify(webMapData)};
        
        wmUpdateReq = new esriRequest({
            url: wmUpdateURL,
            content: wmpd,
            handleAs: 'json'
        },{
            usePost: true,
        });

        wmUpdateReq.then(function (response) {
            updateWebMapDef.resolve();
        });
        return updateWebMapDef.promise; 
    }

    // function to update the URL of a URL-based item
    // acecpts the itemId as a string, owner (user) name as a string, data as an object for the data to be passed in the post
    //     and folderId as an string if the item is within a user folder
    function updateURLbasedItem (itemId, user, data, folderId) {
        
        var itemUpdateURL, updateURLitemDef, updateURLitemReq;

        updateURLitemDef = new Deferred();

        if (folderId){
            itemUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/" + folderId + "/items/" + itemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        else {
            itemUpdateURL = sessionStorage.getItem("portalUrl") + "content/users/" + user + "/items/" + itemId + "/update" + "?token=" + sessionStorage.getItem("token") + "&f=json";
        }
        
        updateURLitemReq = new esriRequest({
            url: itemUpdateURL,
            content: data,
            handleAs: 'json'
        },{
            usePost: true
        });

        updateURLitemReq.then(function (response) {
            updateURLitemDef.resolve();
        });

        //updateURLitemDef.resolve();
        return updateURLitemDef.promise;
    }

    return {
        getUserInfos: getUserInfos,
        updateShortUrl: updateShortUrl,
        updateAllItemURLs: updateAllItemURLs,
    };  
});
        