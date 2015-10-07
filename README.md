### important note:
This project is no longer maintained. I am no longer with Esri and do not have access to an ArcGIS Online organization or an instance of Portal for ArcGIS for testing. If you would like to improve this project, feel free to fork this repository and modify the code. Alternatively, you may conisder contributing the [AGO Assitant](https://github.com/Esri/ago-assistant) repository maintained by @ecaldwell.

# AGO Admin Tools

AGO Admin Tools is a JavaScript application designed to provide additional administrative capabilities to ArcGIS Online.

[View it live](https://174.129.223.249/agoAdminTools/)

## Features

* Change urlKey - change the URL to your org: http://<urlKey>.maps.arcgis.com
* Create Custom Basemap - create a multi-layer basemap
* Update Server/Service Path - Update server/service paths for registered items and webmaps

## Structure

### Root Folder
* index.html

### CSS Folder
* styles.css

### Custom Folder
* templates folder: contians html templates for ContentPanes used to populate tabs

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

## Contributing

Anyone and everyone is welcome to contribute.
