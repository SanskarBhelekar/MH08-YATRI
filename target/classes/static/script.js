/* =========================================================
   MH 08 YATRI
   PROFESSIONAL BOOKING + OPENSTREETMAP + OSRM
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const rideMode =
    document.getElementById("rideMode");

const goodsMode =
    document.getElementById("goodsMode");

const formTitle =
    document.getElementById("formTitle");

const formSubtitle =
    document.getElementById("formSubtitle");

const bookText =
    document.getElementById("bookText");

const bookingSection =
    document.getElementById("booking");

const customerNameInput =
    document.getElementById("customerName");

const pickup =
    document.getElementById("pickup");

const drop =
    document.getElementById("drop");

const vehicle =
    document.getElementById("vehicle");

const date =
    document.getElementById("date");

const time =
    document.getElementById("time");

const fare =
    document.getElementById("fare");

const fareFormula =
    document.getElementById("fareFormula");

const mapStatus =
    document.getElementById("mapStatus");

const routePickup =
    document.getElementById("routePickup");

const routeDrop =
    document.getElementById("routeDrop");

const routeDistance =
    document.getElementById("routeDistance");

const routeTime =
    document.getElementById("routeTime");

const mapLoading =
    document.getElementById("mapLoading");

const mapMessage =
    document.getElementById("mapMessage");

const fitRouteButton =
    document.getElementById("fitRoute");

const clearRouteButton =
    document.getElementById("clearRoute");

const currentLocationButton =
    document.getElementById("currentLocation");

const bookButton =
    document.getElementById("bookButton");

const callDriver =
    document.getElementById("callDriver");

const driverDetails =
    document.getElementById("driverDetails");


/* =========================================================
   VARIABLES
========================================================= */

let currentMode = "ride";

let map = null;

let pickupMarker = null;

let dropMarker = null;

let routeLine = null;

let pickupLocation = null;

let dropLocation = null;

let currentRouteDistance = 0;

let currentRouteTime = 0;


/* =========================================================
   VEHICLE RATES
   ₹ PER KM
========================================================= */

const rates = {

    Bike: 8,

    Auto: 12,

    Car: 18,

    Bus: 35,

    Tempo: 28,

    Truck: 42

};


/* =========================================================
   DATE + TIME
========================================================= */

function initializeDateTime() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const today =
        `${year}-${month}-${day}`;


    if (date) {

        date.min =
            today;

        date.value =
            today;

    }


    if (time) {

        const hours =
            String(
                now.getHours()
            ).padStart(2, "0");

        const minutes =
            String(
                now.getMinutes()
            ).padStart(2, "0");

        time.value =
            `${hours}:${minutes}`;

    }

}


/* =========================================================
   CREATE MAP
========================================================= */

function createMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {

        console.error(
            "Map element not found."
        );

        return;
    }


    if (typeof L === "undefined") {

        console.error(
            "Leaflet is not loaded."
        );

        return;
    }


    map =
        L.map(
            "map",
            {
                zoomControl: true,

                attributionControl: true,

                preferCanvas: true
            }
        );


    /* DEFAULT MH 08 LOCATION */

    map.setView(
        [
            16.9902,
            73.3120
        ],
        12
    );


    /* OPENSTREETMAP */

    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {
            maxZoom: 19,

            minZoom: 3,

            attribution:
                "&copy; OpenStreetMap contributors"
        }

    ).addTo(map);


    /* SCALE */

    L.control
        .scale({
            imperial: false
        })
        .addTo(map);


    /* DEFAULT MARKER */

    L.marker(
        [
            16.9902,
            73.3120
        ]
    )
    .addTo(map)
    .bindPopup(
        "<strong>MH 08 YATRI</strong><br>Maharashtra, India"
    );


    setTimeout(
        () => {

            map.invalidateSize();

        },
        500
    );

}


/* =========================================================
   CUSTOM MARKER
========================================================= */

function createCustomMarker(type) {

    const isPickup =
        type === "pickup";

    return L.divIcon({

        className: "",

        html:
            `
            <div class="custom-marker ${
                isPickup
                    ? "pickup-marker"
                    : "drop-marker"
            }">
                <span>
                    ${isPickup ? "●" : "◆"}
                </span>
            </div>
            `,

        iconSize:
            [38,38],

        iconAnchor:
            [19,38],

        popupAnchor:
            [0,-38]

    });

}


/* =========================================================
   CLEAR MAP
========================================================= */

function clearMapObjects() {

    if (pickupMarker && map) {

        map.removeLayer(
            pickupMarker
        );

        pickupMarker = null;

    }


    if (dropMarker && map) {

        map.removeLayer(
            dropMarker
        );

        dropMarker = null;

    }


    if (routeLine && map) {

        map.removeLayer(
            routeLine
        );

        routeLine = null;

    }


    pickupLocation = null;

    dropLocation = null;

    currentRouteDistance = 0;

    currentRouteTime = 0;


    routePickup.textContent =
        "Not selected";

    routeDrop.textContent =
        "Not selected";

    routeDistance.textContent =
        "-- km";

    routeTime.textContent =
        "-- min";


    mapStatus.textContent =
        "Ready";


    showMapMessage(
        "Enter pickup and destination to see your route."
    );


    calculateFare();

}


/* =========================================================
   MAP MESSAGE
========================================================= */

function showMapMessage(message) {

    mapMessage.textContent =
        message;

    mapMessage.classList.remove(
        "hidden"
    );

}


/* =========================================================
   MAP LOADING
========================================================= */

function setMapLoading(loading) {

    if (loading) {

        mapLoading.classList.add(
            "active"
        );

        mapStatus.textContent =
            "Loading";

    }
    else {

        mapLoading.classList.remove(
            "active"
        );

        mapStatus.textContent =
            "Ready";

    }

}


/* =========================================================
   FIND LOCATION
   NOMINATIM
========================================================= */

async function findLocation(place) {

    if (!place) {
        return null;
    }


    /* LATITUDE,LONGITUDE */

    const coordinateMatch =
        place.match(
            /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
        );


    if (coordinateMatch) {

        const lat =
            parseFloat(
                coordinateMatch[1]
            );

        const lon =
            parseFloat(
                coordinateMatch[2]
            );


        if (
            lat >= -90 &&
            lat <= 90 &&
            lon >= -180 &&
            lon <= 180
        ) {

            return {

                lat,

                lon,

                name:
                    "Current / Coordinate Location"

            };

        }

    }


    try {

        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json" +
            "&limit=1" +
            "&countrycodes=in" +
            "&q=" +
            encodeURIComponent(place);


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Location search failed."
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            return null;

        }


        return {

            lat:
                parseFloat(
                    data[0].lat
                ),

            lon:
                parseFloat(
                    data[0].lon
                ),

            name:
                data[0].display_name

        };

    }
    catch (error) {

        console.error(
            error
        );

        return null;

    }

}


/* =========================================================
   PICKUP MARKER
========================================================= */

function drawPickupMarker(location) {

    if (pickupMarker) {

        map.removeLayer(
            pickupMarker
        );

    }


    pickupMarker =
        L.marker(
            [
                location.lat,
                location.lon
            ],
            {
                icon:
                    createCustomMarker(
                        "pickup"
                    )
            }
        )
        .addTo(map)
        .bindPopup(
            `
            <strong>Pickup</strong><br>
            ${escapeHTML(location.name)}
            `
        );

}


/* =========================================================
   DROP MARKER
========================================================= */

function drawDropMarker(location) {

    if (dropMarker) {

        map.removeLayer(
            dropMarker
        );

    }


    dropMarker =
        L.marker(
            [
                location.lat,
                location.lon
            ],
            {
                icon:
                    createCustomMarker(
                        "drop"
                    )
            }
        )
        .addTo(map)
        .bindPopup(
            `
            <strong>Destination</strong><br>
            ${escapeHTML(location.name)}
            `
        );

}


/* =========================================================
   REAL ROAD ROUTE
   OSRM
========================================================= */

async function drawRoadRoute(
    pickupData,
    dropData
) {

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine = null;

    }


    const routeURL =
        "https://router.project-osrm.org/route/v1/driving/" +
        `${pickupData.lon},${pickupData.lat};` +
        `${dropData.lon},${dropData.lat}` +
        "?overview=full&geometries=geojson";


    try {

        const response =
            await fetch(
                routeURL
            );


        if (!response.ok) {

            throw new Error(
                "Routing service unavailable."
            );

        }


        const data =
            await response.json();


        if (
            data.code !== "Ok" ||
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "No route found."
            );

        }


        const route =
            data.routes[0];


        /* =================================================
           DRAW REAL ROAD
        ================================================= */

        routeLine =
            L.geoJSON(
                route.geometry,
                {

                    style: {

                        color:
                            "#ffb800",

                        weight:
                            7,

                        opacity:
                            .95,

                        lineCap:
                            "round",

                        lineJoin:
                            "round"

                    }

                }
            )
            .addTo(map);


        /* =================================================
           DISTANCE FROM MAP
        ================================================= */

        currentRouteDistance =
            route.distance / 1000;


        /* =================================================
           TIME FROM MAP
        ================================================= */

        currentRouteTime =
            Math.ceil(
                route.duration / 60
            );


        /* DISPLAY */

        routeDistance.textContent =
            `${currentRouteDistance.toFixed(1)} km`;


        routeTime.textContent =
            formatDuration(
                currentRouteTime
            );


        routePickup.textContent =
            shortenLocation(
                pickupData.name
            );


        routeDrop.textContent =
            shortenLocation(
                dropData.name
            );


        /* =================================================
           CALCULATE FARE
        ================================================= */

        calculateFare();


        /* FIT ROUTE */

        map.fitBounds(
            routeLine.getBounds(),
            {
                padding:
                    [50,80],

                maxZoom:
                    15
            }
        );


        mapStatus.textContent =
            "Route Ready";


        mapMessage.classList.add(
            "hidden"
        );


        return true;

    }
    catch (error) {

        console.error(
            "Routing error:",
            error
        );

        mapStatus.textContent =
            "Route Error";

        showMapMessage(
            "Unable to find a road route. Try different locations."
        );

        return false;

    }

}


/* =========================================================
   UPDATE MAP
========================================================= */

async function updateMap() {

    if (!map) {

        console.error(
            "Map is not initialized."
        );

        return;

    }


    const pickupText =
        pickup.value.trim();

    const dropText =
        drop.value.trim();


    if (!pickupText && !dropText) {

        clearMapObjects();

        return;

    }


    setMapLoading(true);


    try {

        let pickupData = null;

        let dropData = null;


        /* FIND PICKUP */

        if (pickupText) {

            pickupData =
                await findLocation(
                    pickupText
                );

        }


        /* FIND DESTINATION */

        if (dropText) {

            dropData =
                await findLocation(
                    dropText
                );

        }


        /* INVALID PICKUP */

        if (
            pickupText &&
            !pickupData
        ) {

            showMapMessage(
                "Pickup location could not be found."
            );

            return;

        }


        /* INVALID DROP */

        if (
            dropText &&
            !dropData
        ) {

            showMapMessage(
                "Destination could not be found."
            );

            return;

        }


        /* PICKUP */

        if (pickupData) {

            pickupLocation =
                pickupData;

            drawPickupMarker(
                pickupData
            );

            routePickup.textContent =
                shortenLocation(
                    pickupData.name
                );

        }


        /* DROP */

        if (dropData) {

            dropLocation =
                dropData;

            drawDropMarker(
                dropData
            );

            routeDrop.textContent =
                shortenLocation(
                    dropData.name
                );

        }


        /* BOTH */

        if (
            pickupData &&
            dropData
        ) {

            await drawRoadRoute(
                pickupData,
                dropData
            );

        }


        /* ONLY PICKUP */

        else if (pickupData) {

            map.setView(
                [
                    pickupData.lat,
                    pickupData.lon
                ],
                15
            );

            showMapMessage(
                "Now enter your destination."
            );

        }


        /* ONLY DROP */

        else if (dropData) {

            map.setView(
                [
                    dropData.lat,
                    dropData.lon
                ],
                15
            );

            showMapMessage(
                "Enter pickup location to create a route."
            );

        }

    }
    catch (error) {

        console.error(
            error
        );

        showMapMessage(
            "Something went wrong while loading the map."
        );

    }
    finally {

        setMapLoading(false);

    }

}


/* =========================================================
   FORMAT DURATION
========================================================= */

function formatDuration(minutes) {

    if (minutes < 60) {

        return `${minutes} min`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );

    const remaining =
        minutes % 60;


    if (remaining === 0) {

        return `${hours} hr`;

    }


    return `${hours} hr ${remaining} min`;

}


/* =========================================================
   SHORTEN LOCATION
========================================================= */

function shortenLocation(name) {

    if (!name) {

        return "Selected";

    }


    const parts =
        name
            .split(",")
            .map(
                item =>
                    item.trim()
            );


    if (parts.length <= 2) {

        return name;

    }


    return parts
        .slice(0,3)
        .join(", ");

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   FARE CALCULATION
=========================================================

   FORMULA:

   Distance × Rate per KM

   Example:

   Car = ₹18/km
   Distance = 12.5 km

   Fare = 12.5 × 18
        = ₹225

========================================================= */

function calculateFare() {

    const selectedVehicle =
        vehicle.value;


    if (!selectedVehicle) {

        fare.textContent =
            "₹ --";

        fareFormula.textContent =
            "Select vehicle and route";

        return;

    }


    if (
        currentRouteDistance <= 0
    ) {

        fare.textContent =
            "₹ --";

        fareFormula.textContent =
            `Rate: ₹${rates[selectedVehicle]}/km`;

        return;

    }


    const rate =
        rates[selectedVehicle];


    let calculatedFare =
        currentRouteDistance * rate;


    /* GOODS EXTRA CHARGE */

    if (
        currentMode === "goods"
    ) {

        calculatedFare += 100;

    }


    calculatedFare =
        Math.ceil(
            calculatedFare
        );


    fare.textContent =
        `₹${calculatedFare.toLocaleString("en-IN")}`;


    fareFormula.textContent =
        currentMode === "goods"

            ? `₹${rate}/km × ${currentRouteDistance.toFixed(1)} km + ₹100 goods charge`

            : `₹${rate}/km × ${currentRouteDistance.toFixed(1)} km`;

}


/* =========================================================
   VEHICLE CHANGE
========================================================= */

vehicle.addEventListener(
    "change",
    function() {

        calculateFare();

    }
);


/* =========================================================
   VEHICLE CARDS
========================================================= */

document
    .querySelectorAll(
        ".vehicle-card"
    )
    .forEach(
        card => {

            card.addEventListener(
                "click",
                function() {

                    const selected =
                        this.dataset.vehicle;


                    vehicle.value =
                        selected;


                    document
                        .querySelectorAll(
                            ".vehicle-card"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    this.classList.add(
                        "selected"
                    );


                    calculateFare();


                    bookingSection.scrollIntoView({
                        behavior:
                            "smooth"
                    });

                }
            );

        }
    );


/* =========================================================
   MODE
========================================================= */

function setMode(mode) {

    currentMode =
        mode;


    if (mode === "ride") {

        rideMode.classList.add(
            "active"
        );

        goodsMode.classList.remove(
            "active"
        );

        formTitle.textContent =
            "Book a Ride";

        formSubtitle.textContent =
            "Fill in your journey details.";

        bookText.textContent =
            "Book My Ride";

    }
    else {

        goodsMode.classList.add(
            "active"
        );

        rideMode.classList.remove(
            "active"
        );

        formTitle.textContent =
            "Transport Goods";

        formSubtitle.textContent =
            "Choose a vehicle for your goods.";

        bookText.textContent =
            "Book Goods Transport";

    }


    calculateFare();


    bookingSection.scrollIntoView({
        behavior:
            "smooth"
    });


    setTimeout(
        () => {

            if (map) {

                map.invalidateSize();

            }

        },
        500
    );

}


/* =========================================================
   MODE BUTTONS
========================================================= */

rideMode.addEventListener(
    "click",
    () => {

        setMode("ride");

    }
);


goodsMode.addEventListener(
    "click",
    () => {

        setMode("goods");

    }
);


/* =========================================================
   HERO RIDE
========================================================= */

document
    .getElementById("heroRide")
    .addEventListener(
        "click",
        () => {

            setMode("ride");

        }
    );


/* =========================================================
   HERO GOODS
========================================================= */

document
    .getElementById("heroGoods")
    .addEventListener(
        "click",
        () => {

            setMode("goods");

        }
    );


/* =========================================================
   HEADER BOOK
========================================================= */

document
    .getElementById("headerBook")
    .addEventListener(
        "click",
        () => {

            setMode("ride");

        }
    );


/* =========================================================
   QUICK BOOK
========================================================= */

document
    .getElementById("quickBook")
    .addEventListener(
        "click",
        function() {

            pickup.value =
                document
                    .getElementById(
                        "quickPickup"
                    )
                    .value
                    .trim();


            drop.value =
                document
                    .getElementById(
                        "quickDrop"
                    )
                    .value
                    .trim();


            setMode("ride");


            setTimeout(
                () => {

                    updateMap();

                },
                500
            );

        }
    );


/* =========================================================
   SERVICE BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".ride-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    setMode("ride");

                }
            );

        }
    );


document
    .querySelectorAll(
        ".goods-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    setMode("goods");

                }
            );

        }
    );


/* =========================================================
   LOCATION INPUT
========================================================= */

pickup.addEventListener(
    "change",
    updateMap
);

drop.addEventListener(
    "change",
    updateMap
);


/* =========================================================
   ENTER SEARCH
========================================================= */

pickup.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            updateMap();

        }

    }
);


drop.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            updateMap();

        }

    }
);


/* =========================================================
   CURRENT LOCATION
========================================================= */

currentLocationButton.addEventListener(
    "click",
    function() {

        if (!navigator.geolocation) {

            alert(
                "Your browser does not support location services."
            );

            return;

        }


        const button =
            this;


        button.disabled =
            true;

        button.textContent =
            "◎ Finding your location...";


        navigator
            .geolocation
            .getCurrentPosition(

                position => {

                    const lat =
                        position.coords.latitude;

                    const lon =
                        position.coords.longitude;


                    /* PUT COORDINATES INTO PICKUP */

                    pickup.value =
                        `${lat.toFixed(6)}, ${lon.toFixed(6)}`;


                    /* SAVE LOCATION */

                    pickupLocation = {

                        lat,

                        lon,

                        name:
                            "Your Current Location"

                    };


                    /* MAP */

                    map.setView(
                        [
                            lat,
                            lon
                        ],
                        16
                    );


                    drawPickupMarker(
                        pickupLocation
                    );


                    routePickup.textContent =
                        "Your Current Location";


                    button.textContent =
                        "✓ Current location added";


                    button.disabled =
                        false;


                    /* IF DROP EXISTS */

                    if (
                        drop.value.trim()
                    ) {

                        updateMap();

                    }
                    else {

                        showMapMessage(
                            "Current location added. Now enter destination."
                        );

                    }

                },


                error => {

                    console.error(
                        error
                    );


                    button.disabled =
                        false;

                    button.textContent =
                        "◎ Use my current location";


                    if (
                        error.code === 1
                    ) {

                        alert(
                            "Location permission was denied. Please allow location access."
                        );

                    }
                    else {

                        alert(
                            "Unable to detect your current location."
                        );

                    }

                },


                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        15000,

                    maximumAge:
                        0

                }

            );

    }
);


/* =========================================================
   FIT ROUTE
========================================================= */

fitRouteButton.addEventListener(
    "click",
    function() {

        if (
            routeLine
        ) {

            map.fitBounds(
                routeLine.getBounds(),
                {
                    padding:
                        [60,80],

                    maxZoom:
                        15
                }
            );

            return;

        }


        if (
            pickupMarker &&
            dropMarker
        ) {

            const bounds =
                L.latLngBounds([
                    pickupMarker.getLatLng(),
                    dropMarker.getLatLng()
                ]);


            map.fitBounds(
                bounds,
                {
                    padding:
                        [60,80]
                }
            );

            return;

        }


        if (
            pickupMarker
        ) {

            map.setView(
                pickupMarker.getLatLng(),
                15
            );

            return;

        }


        if (
            dropMarker
        ) {

            map.setView(
                dropMarker.getLatLng(),
                15
            );

        }

    }
);


/* =========================================================
   CLEAR ROUTE
========================================================= */

clearRouteButton.addEventListener(
    "click",
    function() {

        pickup.value =
            "";

        drop.value =
            "";

        clearMapObjects();


        map.setView(
            [
                16.9902,
                73.3120
            ],
            12
        );

    }
);


/* =========================================================
   BOOKING BUTTON
========================================================= */

bookButton.addEventListener(
    "click",
    async function() {

        const customerNameValue =
            customerNameInput ? customerNameInput.value.trim() : "";

        const pickupValue =
            pickup.value.trim();

        const dropValue =
            drop.value.trim();

        const vehicleValue =
            vehicle.value;

        const dateValue =
            date.value;

        const timeValue =
            time.value;


        /* VALIDATION */

        if (!customerNameValue) {

            alert("Please enter your name.");

            if (customerNameInput) customerNameInput.focus();

            return;

        }


        if (!pickupValue) {

            alert(
                "Please enter pickup location."
            );

            pickup.focus();

            return;

        }


        if (!dropValue) {

            alert(
                "Please enter destination."
            );

            drop.focus();

            return;

        }


        if (!vehicleValue) {

            alert(
                "Please select a vehicle."
            );

            vehicle.focus();

            return;

        }


        if (!dateValue) {

            alert(
                "Please select date."
            );

            date.focus();

            return;

        }


        if (!timeValue) {

            alert(
                "Please select time."
            );

            time.focus();

            return;

        }


        /* MAKE SURE ROUTE EXISTS */

        if (
            !routeLine ||
            currentRouteDistance <= 0
        ) {

            await updateMap();

        }


        if (
            currentRouteDistance <= 0
        ) {

            alert(
                "Please wait for the road route and distance to load."
            );

            return;

        }


        /* FINAL FARE */

        const rate =
            rates[vehicleValue];


        let finalFare =
            currentRouteDistance * rate;


        if (
            currentMode === "goods"
        ) {

            finalFare += 100;

        }


        finalFare =
            Math.ceil(
                finalFare
            );


        /* SEND BOOKING TO SPRING BOOT AND SAVE IN MYSQL */

        const bookingPayload = {
            customerName: customerNameValue,
            pickup: pickupValue,
            destination: dropValue,
            vehicle: vehicleValue,
            vehicleType: vehicleValue,
            bookingType: currentMode === "ride" ? "RIDE" : "GOODS",
            bookingDate: dateValue,
            bookingTime: timeValue.length === 5 ? timeValue + ":00" : timeValue,
            estimatedFare: finalFare
        };

        bookButton.disabled = true;
        if (bookText) bookText.textContent = "Saving Booking...";

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bookingPayload)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.details || result.error ||
                    `Booking request failed (${response.status})`
                );
            }

            const paymentURL = new URL("payment.html", window.location.href);

paymentURL.searchParams.set("bookingId", result.id);
paymentURL.searchParams.set("amount", finalFare);
paymentURL.searchParams.set("name", customerNameValue);

window.location.href = paymentURL.toString();

        } catch (error) {
            console.error("MH 08 YATRI booking error:", error);
            alert(
                "Booking could not be saved.\n\n" +
                error.message +
                "\n\nCheck that Spring Boot is running and try again."
            );
        } finally {
            bookButton.disabled = false;
            if (bookText) bookText.textContent = "Book My Ride";
        }

    }
);


/* =========================================================
   CALL DRIVER
========================================================= */

callDriver.addEventListener(
    "click",
    function() {

        alert(
            "Driver calling feature is ready.\n\nConnect your driver's phone number here."
        );

    }
);


/* =========================================================
   DRIVER DETAILS
========================================================= */

driverDetails.addEventListener(
    "click",
    function() {

        alert(
`DRIVER INFORMATION

Name:
Rajesh Patil

Rating:
★ 4.9

Total Rides:
328

Vehicle:
Maruti Suzuki Dzire

Vehicle Number:
MH 08 AB 4521

Color:
White

Experience:
6+ Years

Verification:
✓ Driving Licence
✓ Vehicle Documents
✓ Identity Verification
✓ Background Check

Status:
✓ VERIFIED DRIVER`
        );

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

initializeDateTime();

createMap();


/* =========================================================
   RESIZE MAP
========================================================= */

window.addEventListener(
    "resize",
    function() {

        if (map) {

            setTimeout(
                () => {

                    map.invalidateSize();

                },
                200
            );

        }

    }
);


/* =========================================================
   PAGE LOAD
========================================================= */

window.addEventListener(
    "load",
    function() {

        if (map) {

            setTimeout(
                () => {

                    map.invalidateSize();

                },
                500
            );

        }

    }
);