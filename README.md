# AGO Admin Tools

AGO Admin Tools is a JavaScript application designed to provide additional administrative capabilities to ArcGIS Online.

<<<<<<< HEAD
=======
* ISSUE: Progress indicators not currently updating in Chrome.

* ISSUE: Update Server/Service path disabled for bug fixing.

>>>>>>> e67a2df7e6fa868b35ed1e1134f0e0d9bc9e89e7
[View it live](http://pholleran.github.com/agoAdminTools/index.html)

## Features

* Change Default Map Extent - Always have the map zoom to your AOI
* Update urlKey - change the URL to your org: http://<urlKey>.maps.arcgis.com
* Update Server/Service Path - Update server/service paths for registered items and webmaps

## Structure

### Root Folder
* index.html

### CSS Folder
* styles.css

### Custom Folder
* templates folder: contians html templates for ContentPanes used to populate tabs
* mapTab.js: code for map tab

### Images Folder
* images go here

### JS Folder
* portal.js: any functions calling the Esri Portal REST API should go in this file
* app.js: any post-initialization application functions (layout, etc,) should go in this file
* layout.js: this file is run on load and handles the initial layout of the application

## Resources

* [ArcGIS for JavaScript API Resource Center](http://help.arcgis.com/en/webapi/javascript/arcgis/index.html)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)
* [twitter@esri](http://twitter.com/esri)

## Known Issues

* Navigating to another tab after opening the "Change Default Map Extent" task will break the map.  Close and re-open tab to correct.

## Contributing

Anyone and everyone is welcome to contribute.
