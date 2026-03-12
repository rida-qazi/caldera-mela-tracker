let map;
let path = [];
let polyline;
let watchID;
let lastPosition = null;

let totalDistance = 0;
let idleSeconds = 0;

let drivingEmissions = 0;
let idleEmissions = 0;
let totalEmissions = 0;

let idleInterval = null;

let truckMarker;

let truckID = "Truck-" + Math.floor(Math.random()*10000);
document.getElementById("truckID").innerText = truckID;



function updateIdleDisplay(){

let mins = Math.floor(idleSeconds / 60);
let secs = idleSeconds % 60;

document.getElementById("idle").innerText =
mins + "m " + secs + "s";

}



function initMap(){

map = new google.maps.Map(document.getElementById("map"),{
zoom:16,
center:{lat:12.9716,lng:77.5946}
});

truckMarker = new google.maps.Marker({
position:{lat:12.9716,lng:77.5946},
map:map,
icon:{
url:"https://maps.google.com/mapfiles/kml/shapes/truck.png",
scaledSize:new google.maps.Size(40,40)
}
});

polyline = new google.maps.Polyline({
path:path,
geodesic:true,
strokeColor:"#ff3b30",
strokeOpacity:1,
strokeWeight:4
});

polyline.setMap(map);

}



function startTracking(){

idleSeconds = 0;
updateIdleDisplay();

document.getElementById("status").innerText = "Tracking Active";
document.getElementById("status").className = "status-active";


watchID = navigator.geolocation.watchPosition(

(position)=>{

let lat = position.coords.latitude;
let lng = position.coords.longitude;

let point = {lat:lat,lng:lng};

let speed = position.coords.speed;


// update truck marker always
map.setCenter(point);
truckMarker.setPosition(point);


// movement detection
if(lastPosition){

let dist = google.maps.geometry.spherical.computeDistanceBetween(
new google.maps.LatLng(lastPosition.lat,lastPosition.lng),
new google.maps.LatLng(lat,lng)
);

// only count real movement
if(dist > 1.5 && speed !== null && speed > 0.2){

totalDistance += dist;

// draw route
path.push(point);
polyline.setPath(path);

// driving emissions
let userDistanceKm = totalDistance / 1000;
let scaledDistance = userDistanceKm * 100;

drivingEmissions = scaledDistance * 1;

}

}


// idle detection
if(speed === null || speed < 0.3){

if(!idleInterval){

idleInterval = setInterval(()=>{

idleSeconds++;

idleEmissions += 0.0007;

},1000);

}

}else{

clearInterval(idleInterval);
idleInterval = null;

}


// always keep total emissions updated
totalEmissions = drivingEmissions + idleEmissions;


lastPosition = {lat,lng};

},

(error)=>{
alert("Location permission required");
},

{
enableHighAccuracy:true,
maximumAge:0,
timeout:5000
}

);

}



function stopTracking(){

navigator.geolocation.clearWatch(watchID);

clearInterval(idleInterval);

document.getElementById("status").innerText = "Tracking Off";
document.getElementById("status").className = "status-off";

}



function generateReport(){

document.getElementById("distance").innerText =
(totalDistance/1000).toFixed(3) + " km";

updateIdleDisplay();

totalEmissions = drivingEmissions + idleEmissions;

document.getElementById("emissions").innerText =
totalEmissions.toFixed(2) + " kg";

}
