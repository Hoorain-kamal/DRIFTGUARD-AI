let navigationData = {

    running: false,

    mode: "GPS",

    latitude: null,

    longitude: null,

    speed: 0,

    accuracy: null,

    status: "Waiting",

    timestamp: null
};


// ==========================================
// SEND NAVIGATION UPDATE
// ==========================================

function sendNavigationUpdate() {

    window.navigationData =
        navigationData;


    window.dispatchEvent(
        new CustomEvent(
            "navigationUpdate",
            {
                detail: navigationData
            }
        )
    );


    console.log(
        "Navigation Data:",
        navigationData
    );

}


// ==========================================
// START NAVIGATION
// ==========================================

function startNavigation() {

    if (navigationData.running) {
        return;
    }


    navigationData.running =
        true;

    navigationData.status =
        "Navigation Active";

    navigationData.timestamp =
        Date.now();


    sendNavigationUpdate();


    const button =
        document.getElementById(
            "startNavigation"
        );


    if (button) {

        button.innerHTML =
            "■ Stop Navigation";

        button.classList.remove(
            "start-btn"
        );

        button.classList.add(
            "stop-btn"
        );

    }


    console.log(
        "Navigation Started"
    );

}


// ==========================================
// STOP NAVIGATION
// ==========================================

function stopNavigation() {

    navigationData.running =
        false;

    navigationData.status =
        "Navigation Stopped";

    navigationData.timestamp =
        Date.now();


    sendNavigationUpdate();


    const button =
        document.getElementById(
            "startNavigation"
        );


    if (button) {

        button.innerHTML =
            "▶ Start Navigation";

        button.classList.remove(
            "stop-btn"
        );

        button.classList.add(
            "start-btn"
        );

    }


    console.log(
        "Navigation Stopped"
    );

}


// ==========================================
// START / STOP BUTTON
// ==========================================

const startNavigationButton =
    document.getElementById(
        "startNavigation"
    );


if (startNavigationButton) {

    startNavigationButton.addEventListener(
        "click",
        function () {

            if (
                navigationData.running
            ) {

                stopNavigation();

            } else {

                startNavigation();

            }

        }
    );

}


// ==========================================
// GPS MODE
// ==========================================

function setGPSNavigation() {

    navigationData.mode =
        "GPS";

    navigationData.status =
        navigationData.running
            ? "GPS Navigation Active"
            : "GPS Ready";

    navigationData.timestamp =
        Date.now();


    sendNavigationUpdate();

}


// ==========================================
// DRIFTGUARD MODE
// ==========================================

function setDriftGuardNavigation() {

    navigationData.mode =
        "DriftGuard";

    navigationData.status =
        "DriftGuard Navigation Active";

    navigationData.timestamp =
        Date.now();


    sendNavigationUpdate();

}


// ==========================================
// UPDATE POSITION
// ==========================================

function updateNavigationPosition(
    latitude,
    longitude,
    speed,
    accuracy
) {

    navigationData.latitude =
        latitude;

    navigationData.longitude =
        longitude;

    navigationData.speed =
        speed || 0;

    navigationData.accuracy =
        accuracy;

    navigationData.timestamp =
        Date.now();


    sendNavigationUpdate();

}


// ==========================================
// RECEIVE GPS DATA
// ==========================================

window.addEventListener(
    "gpsUpdate",
    function (event) {

        const data =
            event.detail;

        if (!data) {
            return;
        }


        updateNavigationPosition(

            data.latitude,

            data.longitude,

            data.speed,

            data.accuracy

        );


        if (
            data.mode ===
            "DriftGuard"
        ) {

            setDriftGuardNavigation();

        } else {

            setGPSNavigation();

        }

    }
);


// ==========================================
// RECEIVE SENSOR DATA
// ==========================================

window.addEventListener(
    "sensorUpdate",
    function (event) {

        const data =
            event.detail;

        if (!data) {
            return;
        }


        console.log(
            "Navigation received sensor data:",
            data
        );

    }
);


// ==========================================
// MAKE FUNCTIONS AVAILABLE
// ==========================================

window.startNavigation =
    startNavigation;

window.stopNavigation =
    stopNavigation;

window.setGPSNavigation =
    setGPSNavigation;

window.setDriftGuardNavigation =
    setDriftGuardNavigation;

window.navigationData =
    navigationData;