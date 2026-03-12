
const supabaseUrl = "https://auvpithbsrattacwyvdk.supabase.co";
const supabaseKey = "sb_publishable_bbueHwws7C0SaYN04H2klw_5yjboqh8";

let supabase;

window.addEventListener("DOMContentLoaded", () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(
            supabaseUrl,
            supabaseKey
        );
    } else {
        console.warn("Supabase library not loaded yet.");
    }
});

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
let truckName = "";


/* ---------- TRUCK SETUP SCREEN ---------- */

function startApp(){

let inputName = document.getElementById("truckNameInput").value;

if(inputName.trim() === ""){
truckName = "Truck-" + Math.floor(Math.random()*1000);
}
else{
truckName = inputName;
}

document.getElementById("truckID").innerText = truckName;

document.getElementById("setupScreen").style.display = "none";
document.getElementById("trackerApp").style.display = "block";

}



/* ---------- MAP INITIALIZATION ---------- */

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



/* ---------- START TRACKING ---------- */

function startTracking(){

idleSeconds = 0;

document.getElementById("status").innerText = "Tracking Active";
document.getElementById("status").className = "status-active";


watchID = navigator.geolocation.watchPosition(

(position)=>{

let lat = position.coords.latitude;
let lng = position.coords.longitude;

let point = {lat:lat,lng:lng};


// update truck marker
map.setCenter(point);
truckMarker.setPosition(point);


if(lastPosition){

let dist = google.maps.geometry.spherical.computeDistanceBetween(
new google.maps.LatLng(lastPosition.lat,lastPosition.lng),
new google.maps.LatLng(lat,lng)
);


// movement threshold
if(dist > 1){

// moving
totalDistance += dist;

path.push(point);
polyline.setPath(path);

clearInterval(idleInterval);
idleInterval = null;


// driving emissions
let userDistanceKm = totalDistance / 1000;
let scaledDistance = userDistanceKm * 100;

drivingEmissions = scaledDistance * 1;

}
else{

// idle
if(!idleInterval){

idleInterval = setInterval(()=>{

idleSeconds++;
idleEmissions += 0.0007;

},1000);

}

}

}


// update emissions
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



/* ---------- STOP TRACKING ---------- */

function stopTracking(){

navigator.geolocation.clearWatch(watchID);

clearInterval(idleInterval);

document.getElementById("status").innerText = "Tracking Off";
document.getElementById("status").className = "status-off";

}



/* ---------- GENERATE REPORT ---------- */

function generateReport(){

let distanceKm = (totalDistance/1000).toFixed(3);

let mins = Math.floor(idleSeconds / 60);
let secs = idleSeconds % 60;

let idleString = mins + "m " + secs + "s";

totalEmissions = drivingEmissions + idleEmissions;

let emissions = totalEmissions.toFixed(2);


// update report panel
document.getElementById("reportDistance").innerText =
distanceKm + " km";

document.getElementById("reportIdle").innerText =
idleString;

document.getElementById("reportEmissions").innerText =
emissions + " kg";
sendReport(distanceKm, idleSeconds, totalEmissions);
}



/* ---------- REPORT DROPDOWN ---------- */

function toggleReport(){

let panel = document.getElementById("reportPanel");

if(panel.style.display === "none" || panel.style.display === ""){
panel.style.display = "block";
}
else{
panel.style.display = "none";
}

}

async function sendReport(distanceKm, idleTime, emissions){

await supabase
.from("truck_reports")
.insert([
{
truck_name: truckName,
distance: totalDistance,
idle_time: idleTime,
emissions: emissions
}
]);

}





