let map;
let path = [];
let polyline;
let watchID;
let lastPosition = null;
let idleTime = 0;
let startTime = null;
let timerInterval;
let totalDistance = 0;
let truckID = "Truck-" + Math.floor(Math.random()*10000);
document.getElementById("truckID").innerText = truckID;
let idleSeconds = 0;
let idleInterval = null;
let drivingEmissions = 0;
let idleEmissions = 0;
let totalEmissions = 0;
let truckMarker;
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
startTime = Date.now();

timerInterval = setInterval(()=>{

let now = Date.now();
let seconds = Math.floor((now - startTime)/1000);

let mins = Math.floor(seconds/60);
let secs = seconds % 60;

document.getElementById("idle").innerText =
mins + "m " + secs + "s";

},1000);
watchID = navigator.geolocation.watchPosition(

(position)=>{

let lat = position.coords.latitude;
let lng = position.coords.longitude;

let point = {lat:lat,lng:lng};

let speed = position.coords.speed;

// Update map visuals first
path.push(point);
polyline.setPath(path);
map.setCenter(point);
truckMarker.setPosition(point);


// SPEED DISPLAY
if(speed !== null){
let kmh = (speed * 3.6).toFixed(2);
document.getElementById("speed").innerText = kmh + " km/h";
}


// DISTANCE + DRIVING EMISSIONS
if(lastPosition){

let dist = google.maps.geometry.spherical.computeDistanceBetween(
new google.maps.LatLng(lastPosition.lat,lastPosition.lng),
new google.maps.LatLng(lat,lng)
);

// Only count movement if it looks real
if(dist > 2 && speed !== null && speed > 0.3){

totalDistance += dist;

document.getElementById("distance").innerText =
(totalDistance/1000).toFixed(2) + " km";

let userDistanceKm = totalDistance / 1000;
let scaledDistance = userDistanceKm * 100;

drivingEmissions = scaledDistance * 1;

}

}


// UPDATE TOTAL EMISSIONS DISPLAY
totalEmissions = drivingEmissions + idleEmissions;

document.getElementById("emissions").innerText =
totalEmissions.toFixed(2) + " kg";


// IDLE DETECTION
if(speed !== null && speed < 0.3){

if(!idleInterval){

idleInterval = setInterval(()=>{

idleSeconds++;

idleEmissions += 0.0007;

totalEmissions = drivingEmissions + idleEmissions;

document.getElementById("emissions").innerText =
totalEmissions.toFixed(2) + " kg";

updateIdleDisplay();

},1000);

}

}else{

clearInterval(idleInterval);
idleInterval = null;

}


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

clearInterval(timerInterval);
clearInterval(idleInterval);

document.getElementById("status").innerText = "Tracking Off";
document.getElementById("status").className = "status-off";


}


