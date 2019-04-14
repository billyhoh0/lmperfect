var express = require("express");
var router = express.Router();

const key = "AIzaSyBFYoMiJxqITP-Dppxtdu8o7NpSN9d5myc";

/* Get closest "warehouse" location
* req.query.loc is a comma separated string of latitude, longitude
* http://localhost:8080/geocode?loc=34.505223,-118.505223
* */
router.get("/", function(req, res, next) {
    let clientLatLong = req.query.loc;

    //retrieve all warehouse locations in latlng format
    let warehouseLocations = [
        "34.505223,-118.243683",
        "44.068203,-114.742043",
        "43.190295,-115.686733",
        "47.549657,-120.213688",
        "42.308688,-76.298719",
        "37.421315,-83.725476",
        "33.725476,-90.141492",
        "30.994832,-95.636117",
        "36.883643,-91.298093",
        "34.093226,-100.658445",
        "42.320232,-112.88215"
    ];

    const googleMapsClient = require("@google/maps").createClient({
        key: key
    });

    googleMapsClient.distanceMatrix({
        origins: clientLatLong,
        destinations: warehouseLocations
    }, function(err, response) {
        let data = response.json;

        //find the index of the closest warehouse
        let indexOfClosestWarehouse = 0;
        for (let i = 0; i < data.rows[0].elements.length; ++i) {
            if (data.rows[0].elements[i].duration.value < data.rows[0].elements[indexOfClosestWarehouse].duration.value) {
                indexOfClosestWarehouse = i;
            }
        }

        let distanceObject = data.rows[0].elements[indexOfClosestWarehouse];

        let closestWarehouse = {
            address: data.destination_addresses[indexOfClosestWarehouse],
            location: warehouseLocations[indexOfClosestWarehouse],
            distance: {
                text: distanceObject.distance.text,
                value: distanceObject.distance.value
            },
            duration: {
                text: distanceObject.duration.text,
                value: distanceObject.duration.value
            },
        };

        res.send(closestWarehouse);
    });
});

module.exports = router;

