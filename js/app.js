// =========================================
// DRIFTGUARD AI
// MAIN JAVASCRIPT
// =========================================


// =========================================
// MAP SETUP
// =========================================

const map =
    L.map("map").setView(
        [12.9716, 77.5946],
        18
    );


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// =========================================
// MAP VARIABLES
// =========================================

let userMarker = null;

let travelledPath =
    L.polyline(
        [],
        {
            weight: 5,
            opacity: 0.8
        }
    ).addTo(map);


let previousPosition = null;

let displayedPosition = null;

let totalDistance = 0;

let currentSpeed = 0;

let maximumSpeed = 0;

let currentAccuracy = 0;

let followLocation = true;

let updateCount = 0;

let firstGPSLocation = true;

// OSRM matched-road overlay (visual aid only)
let osrmMatchedPath = L.geoJSON(null, { weight: 4, opacity: 0.65 }).addTo(map);
window.addEventListener('osrmMatchUpdate', function(event){
    const data=event.detail;
    if(data && data.matchings && data.matchings.length){
        const features=data.matchings.map(m=>m.geometry ? {type:'Feature',properties:{},geometry:m.geometry}:null).filter(Boolean);
        if(features.length){ osrmMatchedPath.clearLayers(); osrmMatchedPath.addData({type:'FeatureCollection',features}); }
    }
});



// =========================================
// MOVEMENT SETTINGS
// =========================================

// Below this speed, we consider the
// device to be stationary.

const STATIONARY_SPEED =
    3;


// Minimum movement required before
// changing the displayed marker.

const MIN_MOVEMENT =
    0.5;


// =========================================
// NAVIGATION MODE
// =========================================

const navigationMode =
    document.getElementById(
        "navigationMode"
    );

const navigationModeText =
    document.getElementById(
        "navigationModeText"
    );


function showGPSNavigation() {

    if (navigationModeText) {

        navigationModeText.textContent =
            "GPS NAVIGATION";

    }


    if (navigationMode) {

        navigationMode.classList.remove(
            "ai-mode"
        );

    }

}


function showAINavigation() {

    if (navigationModeText) {

        navigationModeText.textContent =
            "AI NAVIGATION";

    }


    if (navigationMode) {

        navigationMode.classList.add(
            "ai-mode"
        );

    }

}


showGPSNavigation();


// =========================================
// DISTANCE CALCULATION
// =========================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371000;


    const lat1Rad =
        lat1 * Math.PI / 180;

    const lat2Rad =
        lat2 * Math.PI / 180;


    const deltaLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const deltaLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =
        Math.sin(deltaLat / 2) ** 2 +

        Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *

        Math.sin(deltaLon / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;
}


// =========================================
// GPS UPDATE
// =========================================

window.addEventListener(
    "gpsUpdate",
    function (event) {

        const data =
            event.detail;


        console.log(
            "GPS UPDATE RECEIVED:",
            data
        );


        // =================================
        // CHECK DATA
        // =================================

        if (
            !data ||
            data.latitude === null ||
            data.longitude === null
        ) {

            return;

        }


        const latitude =
            Number(data.latitude);

        const longitude =
            Number(data.longitude);


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            return;

        }


        // =================================
        // SPEED
        // =================================

        currentSpeed =
            Number(data.speed) || 0;


        const speedKmh =
            currentSpeed * 3.6;


        // =================================
        // ACCURACY
        // =================================

        if (
            data.accuracy !== null &&
            Number.isFinite(
                Number(data.accuracy)
            )
        ) {

            currentAccuracy =
                Number(data.accuracy);

        } else {

            currentAccuracy = 0;

        }


        updateCount++;


        // =================================
        // POSITION DISTANCE
        // =================================

        let distanceFromPrevious =
            0;


        if (
            displayedPosition !== null
        ) {

            distanceFromPrevious =
                calculateDistance(

                    displayedPosition.latitude,

                    displayedPosition.longitude,

                    latitude,

                    longitude

                );

        }


        // During DriftGuard, consume the DR's incremental distance directly.
        // This avoids losing small per-frame movements to the GPS movement threshold.
        if (data.mode === "DriftGuard" && Number.isFinite(Number(data.distanceDelta))) {
            const deltaMeters = Math.max(0, Number(data.distanceDelta));
            totalDistance += deltaMeters / 1000;
            displayedPosition = { latitude, longitude };
            if (userMarker) userMarker.setLatLng([latitude, longitude]);
            travelledPath.addLatLng([latitude, longitude]);
            if (followLocation) map.setView([latitude, longitude], 19, {animate:false});
        }

        // =================================
        // DETERMINE IF USER IS MOVING
        // =================================

        const isActuallyMoving =
            speedKmh >= STATIONARY_SPEED;


        // =================================
        // POSITION UPDATE DECISION
        // =================================

        let acceptNewPosition =
            false;


        // First GPS location
        if (
            displayedPosition === null
        ) {

            acceptNewPosition = true;

        }


        // If actually moving
        else if (
            isActuallyMoving &&
            distanceFromPrevious >= MIN_MOVEMENT
        ) {

            acceptNewPosition = true;

        }


        // DriftGuard estimated movement
        else if (
            data.mode === "DriftGuard" &&
            !Number.isFinite(Number(data.distanceDelta)) &&
            distanceFromPrevious >= MIN_MOVEMENT
        ) {

            acceptNewPosition = true;

        }


        // =================================
        // FIRST GPS LOCATION
        // =================================

        if (
            firstGPSLocation
        ) {

            displayedPosition = {

                latitude:
                    latitude,

                longitude:
                    longitude

            };


            travelledPath.addLatLng(
                [
                    latitude,
                    longitude
                ]
            );


            // Create marker

            userMarker =
                L.marker(
                    [
                        latitude,
                        longitude
                    ]
                ).addTo(map);


            userMarker.bindPopup(
                "📍 Your Current Location"
            );


            // Automatically locate

            map.setView(

                [
                    latitude,
                    longitude
                ],

                19,

                {
                    animate: true
                }

            );


            firstGPSLocation =
                false;


            console.log(
                "⭐ AUTOMATICALLY LOCATED USER:",
                latitude,
                longitude
            );

        }


        // =================================
        // USER IS MOVING
        // =================================

        else if (
            acceptNewPosition &&
            !(data.mode === "DriftGuard" && Number.isFinite(Number(data.distanceDelta)))
        ) {

            // Add distance

            totalDistance +=
                distanceFromPrevious / 1000;


            // Update displayed position

            displayedPosition = {

                latitude:
                    latitude,

                longitude:
                    longitude

            };


            // Update marker

            if (userMarker) {

                userMarker.setLatLng(

                    [
                        latitude,
                        longitude
                    ]

                );

            }


            // Add to travelled path

            travelledPath.addLatLng(

                [
                    latitude,
                    longitude
                ]

            );


            // Follow moving user

            if (
                followLocation
            ) {

                map.setView(

                    [
                        latitude,
                        longitude
                    ],

                    19,

                    {
                        animate: true
                    }

                );

            }


            console.log(
                "🚗 USER MOVED:",
                distanceFromPrevious.toFixed(1),
                "meters"
            );

        }


        // =================================
        // GPS JUMP / STATIONARY PROTECTION
        // =================================

        else {

            if (
                !isActuallyMoving
            ) {

                console.log(
                    "🛑 USER STATIONARY - GPS JUMP IGNORED:",
                    distanceFromPrevious.toFixed(1),
                    "meters"
                );

            }

            else {

                console.log(
                    "📍 Small GPS movement ignored:",
                    distanceFromPrevious.toFixed(1),
                    "meters"
                );

            }

        }


        // =================================
        // MAXIMUM SPEED
        // =================================

        if (
            speedKmh >
            maximumSpeed
        ) {

            maximumSpeed =
                speedKmh;

        }


        // =================================
        // DASHBOARD
        // =================================

        const speedValue =
            document.getElementById(
                "speedValue"
            );


        const distanceValue =
            document.getElementById(
                "distanceValue"
            );


        const gpsStatus =
            document.getElementById(
                "gpsStatus"
            );


        const driftMode =
            document.getElementById(
                "driftMode"
            );


        if (speedValue) {

            speedValue.textContent =
                speedKmh.toFixed(1);

        }


        if (distanceValue) {

            distanceValue.textContent =
                totalDistance.toFixed(2);

        }


        if (gpsStatus) {

            gpsStatus.textContent =
                data.status ||
                "Active";

        }


        if (driftMode) {

            driftMode.textContent =
                data.mode ===
                "DriftGuard"
                    ? "ACTIVE"
                    : "STANDBY";

        }


        // =================================
        // GPS / AI HEADER
        // =================================

        if (
            data.mode ===
            "DriftGuard"
        ) {

            showAINavigation();

        }

        else {

            showGPSNavigation();

        }


        // =================================
        // NAVIGATION PAGE
        // =================================

        const latitudeDisplay =
            document.getElementById(
                "latitude"
            );


        const longitudeDisplay =
            document.getElementById(
                "longitude"
            );


        const navigationSpeed =
            document.getElementById(
                "navigationSpeed"
            );


        const accuracyDisplay =
            document.getElementById(
                "accuracy"
            );


        const navigationStatus =
            document.getElementById(
                "navigationStatus"
            );


        // Show the latest GPS coordinates

        if (latitudeDisplay) {

            latitudeDisplay.textContent =
                latitude.toFixed(6);

        }


        if (longitudeDisplay) {

            longitudeDisplay.textContent =
                longitude.toFixed(6);

        }


        if (navigationSpeed) {

            navigationSpeed.textContent =
                speedKmh.toFixed(1);

        }


        if (accuracyDisplay) {

            accuracyDisplay.textContent =
                currentAccuracy > 0
                    ? currentAccuracy.toFixed(1)
                    : "--";

        }


        if (navigationStatus) {

            navigationStatus.textContent =
                data.mode ===
                "DriftGuard"
                    ? "DriftGuard Active"
                    : "GPS Location Active";

        }


        // =================================
        // ANALYTICS
        // =================================

        const analyticsSpeed =
            document.getElementById(
                "analyticsSpeed"
            );


        const maxSpeed =
            document.getElementById(
                "maxSpeed"
            );


        const analyticsDistance =
            document.getElementById(
                "analyticsDistance"
            );


        const analyticsAccuracy =
            document.getElementById(
                "analyticsAccuracy"
            );


        const updateCountDisplay =
            document.getElementById(
                "updateCount"
            );


        if (analyticsSpeed) {

            analyticsSpeed.textContent =
                speedKmh.toFixed(1);

        }


        if (maxSpeed) {

            maxSpeed.textContent =
                maximumSpeed.toFixed(1);

        }


        if (analyticsDistance) {

            analyticsDistance.textContent =
                totalDistance.toFixed(2);

        }


        if (analyticsAccuracy) {

            analyticsAccuracy.textContent =
                currentAccuracy > 0
                    ? currentAccuracy.toFixed(1)
                    : "--";

        }


        if (updateCountDisplay) {

            updateCountDisplay.textContent =
                updateCount;

        }

    }
);


// =========================================
// LOCATE ME BUTTON
// =========================================

const locateButton =
    document.getElementById(
        "locateButton"
    );


if (locateButton) {

    locateButton.addEventListener(
        "click",
        function () {

            /*
             * Use the displayed stable
             * position rather than a
             * noisy GPS jump.
             */

            if (
                displayedPosition !== null
            ) {

                map.setView(

                    [
                        displayedPosition.latitude,
                        displayedPosition.longitude
                    ],

                    19,

                    {
                        animate: true
                    }

                );


                if (userMarker) {

                    userMarker.openPopup();

                }


                console.log(
                    "📍 LOCATED USER:",
                    displayedPosition.latitude,
                    displayedPosition.longitude
                );

            }

            else {

                alert(
                    "Waiting for GPS location..."
                );

            }

        }
    );

}


// =========================================
// ZOOM IN
// =========================================

const zoomInButton =
    document.getElementById(
        "zoomIn"
    );


if (zoomInButton) {

    zoomInButton.addEventListener(
        "click",
        function () {

            map.zoomIn();

        }
    );

}


// =========================================
// ZOOM OUT
// =========================================

const zoomOutButton =
    document.getElementById(
        "zoomOut"
    );


if (zoomOutButton) {

    zoomOutButton.addEventListener(
        "click",
        function () {

            map.zoomOut();

        }
    );

}


// =========================================
// FOLLOW TOGGLE
// =========================================

const followToggle =
    document.getElementById(
        "followToggle"
    );


if (followToggle) {

    followLocation =
        followToggle.checked;


    followToggle.addEventListener(
        "change",
        function () {

            followLocation =
                this.checked;

        }
    );

}


// =========================================
// SENSOR UPDATE
// =========================================

window.addEventListener(
    "sensorUpdate",
    function (event) {

        console.log(
            "SENSOR UPDATE:",
            event.detail
        );

    }
);


// =========================================
// SIDEBAR NAVIGATION
// =========================================

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );


const pages =
    document.querySelectorAll(
        ".page"
    );


const pageTitle =
    document.getElementById(
        "pageTitle"
    );


navLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                const pageName =
                    this.dataset.page;


                // Remove active

                navLinks.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                // Add active

                this.classList.add(
                    "active"
                );


                // Hide pages

                pages.forEach(
                    function (page) {

                        page.classList.remove(
                            "active-page"
                        );

                    }
                );


                // Show selected page

                const selectedPage =
                    document.getElementById(
                        pageName
                    );


                if (selectedPage) {

                    selectedPage.classList.add(
                        "active-page"
                    );

                }


                // =================================
                // PAGE TITLES
                // =================================

                if (pageTitle) {

                    if (
                        pageName ===
                        "dashboard"
                    ) {

                        pageTitle.textContent =
                            "Navigation You Can Trust";

                    }

                    else if (
                        pageName ===
                        "navigation"
                    ) {

                        pageTitle.textContent =
                            "Live Navigation";

                    }

                    else if (
                        pageName ===
                        "alerts"
                    ) {

                        pageTitle.textContent =
                            "System Alerts";

                    }

                    else if (
                        pageName ===
                        "analytics"
                    ) {

                        pageTitle.textContent =
                            "Navigation Analytics";

                    }

                    else if (
                        pageName ===
                        "settings"
                    ) {

                        pageTitle.textContent =
                            "System Settings";

                    }

                }


                // Fix Leaflet

                setTimeout(
                    function () {

                        map.invalidateSize();

                    },
                    100
                );

            }
        );

    }
);


// =========================================
// INITIAL MAP FIX
// =========================================

setTimeout(
    function () {

        map.invalidateSize();

    },
    500
);


// =========================================
// APP LOADED
// =========================================

console.log(
    "DRIFTGUARD APP.JS LOADED"
);