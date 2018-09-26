var L = require('leaflet');
var Esri = require('esri-leaflet');
var Geocoding = require('esri-leaflet-geocoder');
var moment = require('moment');
var locate = require('leaflet.locatecontrol');
require('dotenv').config();





var mapTiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    detectRetina: true,
    accessToken: process.env.MAP_CODE
  });

var mapSatellite = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.satellite',
    detectRetina: true,
    accessToken: process.env.MAP_CODE
  });

var map = L.map('mapid',{
  center: [38.850608, -98.470158],
  zoom: 5,
  layers: [mapTiles, mapSatellite]
});

var baseLayers = {
  "Satellie": mapSatellite,
  "Street": mapTiles
};

//mapTiles.addTo(map);
L.control.layers(baseLayers).addTo(map);
var lc = L.control.locate().addTo(map);

var searchControl = Geocoding.geosearch().addTo(map);



function getPolygons(coordinates, timestamp, time){
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
    var isochrones = L.polygon(polygonArray);
    isochrones.addTo(map);
  });
}

function getDay(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1;
  var yyyy = today.getFullYear();

  if(dd < 10){
    dd = '0'+ dd;
  }

  if(mm < 10){
    mm = '0' + mm;
  }

  today = yyyy + '-' + mm + '-' + dd + 'T';
  return today;
}


function getMinutes(){
  var minutes = document.getElementById("minutes").value;
  var seconds = minutes * 60;
  return seconds;
}

function getTime(){
  var time = document.getElementById("time").value;
  if (time === "") {
    time = "12:00";
  }
  return time;
}

searchControl.on('results', function(data){
  var lat = data.results[0].latlng.lat;
  var lon = data.results[0].latlng.lng;
  var coordinates = lat.toString() + "," +lon.toString();
  var time = getTime();
  var day = getDay();
  var timestamp = day+time+":00";
  var minutes = getMinutes();
  //var seconds = minutes * 60;

  var userMarker = L.marker([lat,lon],{
    draggable: true,
    autoPan: true
  });

  getPolygons(coordinates, timestamp, minutes);
  userMarker.addTo(map);

  userMarker.on('moveend',function(e){
    var newMinutes = getMinutes();
    var newDay = getDay();
    var newTime = getTime();
    var newTimestamp = newDay+newTime+":00";
    var coords = userMarker.getLatLng();
    var newLat = coords.lat;
    var newLng = coords.lng;
    var newCoords = newLat + "," + newLng;
    getPolygons(newCoords, newTimestamp, newMinutes);
  });

});

document.getElementById('export').onclick = function(e){
  var exportGroup = L.layerGroup();
  var toExport;
  map.eachLayer(function(layer){
    if(layer == mapTiles || layer ==  userMarker || layer == mapSatellite){
      console.log('nothing');
    } else{
      exportGroup.addLayer(layer);
      var data = exportGroup.toGeoJSON();
      toExport = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    }
  });
  document.getElementById('export').setAttribute('href', 'data:'+ toExport);
  document.getElementById('export').setAttribute('download', 'isochrones.geojson');
};

document.getElementById('clear').onclick = function(e){
  map.eachLayer(function(layer){
    if(layer == mapTiles || layer == mapSatellite){
      console.log("hello");
    } else{
      map.removeLayer(layer);
    }
  });
};
