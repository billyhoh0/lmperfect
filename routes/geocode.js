var express = require("express");
var router = express.Router();
const mysql = require("mysql");

const key = "AIzaSyBFYoMiJxqITP-Dppxtdu8o7NpSN9d5myc";

/* Get closest "warehouse" location
* req.query.loc is a comma separated string of latitude, longitude
* http://localhost:8080/geocode?loc=34.505223,-118.505223
* */
router.get("/", function(req, res, next) {
    let clientLatLong = req.query.loc;

    let connection = mysql.createConnection({
        host: "35.247.32.84",
        user: "root",
        database: "hackSC19",
        password: "root"
    });

    connection.connect(function(err) {
        if (err) {
            console.log(err.stack);
            return;
        } else {
            console.log("Connected.");
            connection.query("SELECT Latitude, Longitude FROM warehouseLocations;",
                function (error, results, fields) {
                    if (error) {
                        console.log("error");
                        return;
                    }

                    //retrieve all warehouse locations
                    let warehouseLocations = [];

                    for (var i = 0; i < results.length; ++i) {
                        let coordinate = results[i].Latitude + ',' + results[i].Longitude;
                        warehouseLocations.push(coordinate);
                    }

                    //find the closest warehouse
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
                            items: []
                        };

                        //now take the latitude and longitude of the closest warehouse and get the stuff located at the closest warehouse
                        connection.query("select CategoryName, sum(h.FailedCases) AS FailedCases, Latitude, Longitude " +
                            "from hackscdeidentified h, warehouseLocations w " +
                            "where h.ReceivingWarehouse=w.ReceivingWareHouse " +
                            "AND Latitude=? AND Longitude=? " +
                            "AND h.FailedCases>0 " +
                            "GROUP BY CategoryName, h.ReceivingWarehouse, Latitude, Longitude;",
                            [closestWarehouse.location.split(',')[0],
                                closestWarehouse.location.split(',')[1]],
                            function (error, results, fields) {
                            for (var i = 0; i < results.length; ++i) {
                                let item = {
                                    name: results[i].CategoryName,
                                    cases: results[i].FailedCases
                                };

                                closestWarehouse.items.push(item);
                            }

                            res.send(closestWarehouse);
                        });

                    });
                });
        }
    });

});

module.exports = router;






module.exports = router;
