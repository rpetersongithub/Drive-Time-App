var L = require('leaflet');
var Esri = require('esri-leaflet');
var Geocoding = require('esri-leaflet-geocoder');
require('dotenv').config();



var map = L.map('mapid').setView([45.480174, -122.693377], 12);


L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox.streets',
  detectRetina: true,
  accessToken: process.env.MAP_CODE
}).addTo(map);



var searchControl = Geocoding.geosearch().addTo(map);

searchControl.on('results', function(data){
  var lat = data.results[0].latlng.lat;
  var lon = data.results[0].latlng.lng;
  var coordinates = lat.toString() + "," +lon.toString();
  var timestamp = '2018-04-19T17:00:00-07'
  var minutes = document.getElementById("minutes").value;
  var time = minutes * 60


  fetch("https://isoline.route.cit.api.here.com/routing/7.2/calculateisoline.json?app_id=" + process.env.APP_ID + "&app_code=" + process.env.APP_CODE + "&mode=shortest;car;traffic:enabled&start=geo!" + coordinates + "&maxpoints=500&departure=" + timestamp + "&range=" + time + "&rangetype=time&jsonAttributes=41")
  .then(res => res.json())
  .then(data => {
    var polygonArray = [];
    for(var i = 0; i < 1; i++){
      for(var x = 0; x <= data.response.isoline[i].component[0].shape.length - 1; x++){
        if(x % 2 === 0){
          var coordPair = [];
          coordPair.push(data.response.isoline[i].component[0].shape[x]);
          coordPair.push(data.response.isoline[i].component[0].shape[x + 1]);
          polygonArray.push(coordPair);
        }
      }
    }
    var isochrones = L.polygon(polygonArray).addTo(map);
    document.getElementById('clear').onclick = function(e){
      map.removeLayer(isochrones);
    }
    document.getElementById('export').onclick = function(e){

    var data = isochrones.toGeoJSON();
    var toExport = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));

    document.getElementById('export').setAttribute('href', 'data:'+ toExport);
    document.getElementById('export').setAttribute('download', 'isochrones.geojson');
    }
  });
});
