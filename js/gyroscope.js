const startButton = document.getElementById("startButton");

const alphaDisplay = document.getElementById("alpha");
const betaDisplay = document.getElementById("beta");
const gammaDisplay = document.getElementById("gamma");

const statusDisplay = document.getElementById("status");


startButton.addEventListener("click", async () => {

    try {

        // Some browsers require permission
        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {

            const permission =
                await DeviceOrientationEvent.requestPermission();

            if (permission !== "granted") {

                statusDisplay.innerText =
                    "Sensor Status: Permission Denied";

                return;
            }
        }

        window.addEventListener(
            "deviceorientation",
            handleOrientation
        );

        statusDisplay.innerText =
            "Sensor Status: Active";

    } catch (error) {

        statusDisplay.innerText =
            "Sensor Error: " + error.message;

    }

});


function handleOrientation(event) {

    const alpha = event.alpha || 0;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;

    alphaDisplay.innerText =
        alpha.toFixed(2);

    betaDisplay.innerText =
        beta.toFixed(2);

    gammaDisplay.innerText =
        gamma.toFixed(2);
}