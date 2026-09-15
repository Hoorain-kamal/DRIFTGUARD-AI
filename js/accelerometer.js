const startButton = document.getElementById("startButton");

const xDisplay = document.getElementById("x");
const yDisplay = document.getElementById("y");
const zDisplay = document.getElementById("z");
const timeDisplay = document.getElementById("time");

const statusDisplay = document.getElementById("status");


function handleMotion(event) {

    const acceleration = event.accelerationIncludingGravity;

    if (
        !acceleration ||
        acceleration.x === null ||
        acceleration.y === null ||
        acceleration.z === null
    ) {
        statusDisplay.textContent =
            "Accelerometer data unavailable";
        return;
    }

    const x = acceleration.x;
    const y = acceleration.y;
    const z = acceleration.z;

    // Apply calibration
const calibrated = getCalibratedAcceleration(x, y, z);

    const timestamp = Date.now();


    // Display sensor values
    xDisplay.textContent = x.toFixed(2);
    yDisplay.textContent = y.toFixed(2);
    zDisplay.textContent = z.toFixed(2);

    timeDisplay.textContent = timestamp;


    // NAVISENSE sensor data
const sensorData = {
    x: calibrated.corrected.x,
    y: calibrated.corrected.y,
    z: calibrated.corrected.z,
    timestamp: timestamp
};

    console.log("Accelerometer Data:", sensorData);
}


async function startAccelerometer() {

    try {

        // iPhone/iPad permission
        if (
            typeof DeviceMotionEvent !== "undefined" &&
            typeof DeviceMotionEvent.requestPermission === "function"
        ) {

            const permission =
                await DeviceMotionEvent.requestPermission();

            if (permission !== "granted") {
                statusDisplay.textContent =
                    "Motion permission denied";
                return;
            }
        }

        // Start sensor
        window.addEventListener(
            "devicemotion",
            handleMotion
        );

        statusDisplay.textContent =
            "Accelerometer running — move your phone!";

        startButton.disabled = true;

    } catch (error) {

        console.error("Sensor Error:", error);

        statusDisplay.textContent =
            "Could not access accelerometer";
        }
}

startAccelerometer();