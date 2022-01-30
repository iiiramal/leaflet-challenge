// create the tile layers for the background of the map
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});



// add gray scale 

var grayScale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

// water color layer

var waterColor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});


// topography

let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

//make basemaps object 
let basemaps = {
    Grayscale: grayScale,
    "Water color": waterColor,
    "Topography": topoMap,
    Default: defaultMap
}

// ake a map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 4,
    layers: [defaultMap, grayScale]
});

// add the default map to the map
defaultMap.addTo(myMap);

// get tectonic plate data and draw on map
// variable to hold tectonic plate layer

let tectonicplates = new L.layerGroup();

// call the api to get info for t plates. 
d3.json('https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json')
.then(function(plateData){
    //console log to make sure data loads
    //console.log(plateData);

    //load data using geoJSON and add to t plate layer group

    L.geoJson(plateData,{
        // add styling to make lines visible
        color: "red", 
        weight: 1
    }).addTo(tectonicplates)
});

// add t plates to map
tectonicplates.addTo(myMap);

// variable to hold earthquakes data layer

let earthquakes = new L.layerGroup();

// get earthquake data and populate layer group
//call the USGS GeoJson API

d3.json('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson').then(
    function(earthquakeData){
         //console log to make sure data loads
         //console.log(earthquake);

         //plot circles where radius is dependen on magnitude and color is dependent on depth. 

         // make a function that chooses color of data point

         function dataColor(depth){
            if (depth > 90)
                return "red";
            else if (depth > 70 )
                return "#fc6203"; 
            else if (depth > 50 )
                return "#fc8803";
            else if (depth > 30 )
                return "#fcb603";
            else if (depth > 10 )
                return "#cafc03";
            else
                return "green";
         }

         // make a function that determines the size of radius

         function radiusSize(mag){
             if (mag == 0)
                return 1; //makes sure that a 0 mag earthquake shows up
            else
                return mag * 5; // makes sure that the circle is pronounced in the map. 
         }
         // add on to the style for each data point. 
         function datastyle(feature)
         {
             return{
                 opacity: 5, 
                 fillOpacity: .5, 
                 fillColor: dataColor(feature.geometry.coordinates[2]), //use index 2 for the depth
                 color: "000000", //black outline
                 radius: radiusSize(feature.properties.mag), //grabs magnitude
                 weight: 0.5,
                 stroke: true
             }
         }
         // add the GEOJson Data to the earthquake layer group
         L.geoJson(earthquakeData,{
            // make each feature a marker that is on the map, each marker is a circle
            pointToLayer: function(feature, latLng){
                return L.circleMarker(latLng);
            }, 
            //set style for each marker
            style:  datastyle, // calls the data style function and passes in eq data 
            // add popups

            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`)
            }

         }).addTo(earthquakes);
    }   
);

// add the earthquake layer to the map
earthquakes.addTo(myMap);

// add the overlay for the t plates and earth quakes
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// add layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

// add the legend to the map
let legend = L.control({
    position: "bottomright"
});

//add legend properties
legend.onAdd = function(){
    //div for legend to appear in the page
    let div = L.DomUtil.create('div', 'info legend');

    let intervals = [-10, 10, 30, 50, 70, 90];
    //set the colors
    let colors = [
        "green",
        "#cafc03",
        "#fcb603",
        "#fc8803",
        "#fc6203",
        "red"
    ]; 

    // loop through the intervals and the colors and generate a label
    // with a colored square for each interval
    for(var i = 0; i < intervals.length; i++){

        //inner html that sets square for each interval and label
        div.innerHTML += "<i style = 'background: "
            +colors[i]
            +"'></i>"
            +intervals[i] 
            +(intervals[i + 1] ? "km &mdash; " + intervals[i+1] + "km <br>" : "+")
    }
    return div; 
}; 

//add legend to map
legend.addTo(myMap)
