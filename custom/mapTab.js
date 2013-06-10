define([
	"dijit/registry",
	
	"dojo/dom",
	"dojo/on",
	"dojo/json",
	
	"dojo/request/xhr",
	
	"esri/geometry/Extent",
	"esri/SpatialReference",
	"esri/map",
	"esri/layers/ArcGISTiledMapServiceLayer",
	
], function(registry,dom,on,JSON,xhr,Extent,SpatialReference,Map,ArcGISTiledMapServiceLayer){
		
		var map;

		function createMap(){

			var defaultBasemap = JSON.parse(sessionStorage.getItem("defaultBasemap"));
			var defaultExtent = JSON.parse(sessionStorage.getItem("defaultExtent"));

			// set defaults
			var baseURL = (defaultBasemap.baseMapLayers[0].url);
			var baseSR = new SpatialReference(defaultExtent.spatialReference);
			var baseExtent = new Extent(
				defaultExtent.xmin,
				defaultExtent.ymin,
				defaultExtent.xmax,
				defaultExtent.ymax,
				baseSR);

			// create map using response info
			map = new Map("mapDiv", {extent: baseExtent});
			var baseMap = new ArcGISTiledMapServiceLayer(baseURL);
			map.addLayer(baseMap);

			// handle extent change
			map.on("extent-change",function(response){
				
				var xmin = response.extent.xmin;
				var ymin = response.extent.ymin;
				var xmax = response.extent.xmax;
				var ymax = response.extent.ymax;
				var s = "";
		        s ="<p>" 
		           +"<b>xMin: </b>"+ xmin.toFixed(0) + " &nbsp;&nbsp;"
		           +"<b>yMin: </b>" + ymin.toFixed(0) + " &nbsp;&nbsp;"
		           +"<b>xMax: </b>" + xmax.toFixed(0) + " &nbsp;&nbsp;"
		           +"<b>yMax: </b>" + ymax.toFixed(0);+"</p>"
		        dom.byId("extentDiv").innerHTML = s;
		    })
		}
		
		function setExtent() {
			
			var currentExtentString = JSON.stringify(map.extent);
			var postJSON = {'defaultExtent': currentExtentString};
			var url = sessionStorage.getItem("portalUrl") + "portals/" + sessionStorage.getItem("portalID") + "/update?f=json&token=" + sessionStorage.getItem("token");
			
			//Perform the POST request
			xhr.post(url,{
				data: postJSON,
				preventCache: true,
				handleAs: "json",
				headers: {
					"X-Requested-With": "",
					},
			}).then(function(response){
				if(response.success == true){
					alert("Extent Updated");
					sessionStorage.setItem("defaultExtent", currentExtentString);
				}
				else{
					alert("Error: Unable to Update Extent");
				}
			})
		}
		
		return{
			createMap: createMap,
			setExtent: setExtent,
		}
	}
)
