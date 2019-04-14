var express = require("express");
var router = express.Router();
const mysql = require("mysql");

const key = "AIzaSyBFYoMiJxqITP-Dppxtdu8o7NpSN9d5myc";

/* Get warehouse locations within 100km with the desired item
* req.query.loc is a comma separated string of latitude, longitude
* http://localhost:8080/findItem?loc=34.0407315,-118.25545979999998&item=Mangos
* */
router.get("/", function(req, res, next) {
    let itemSearch = req.query.item;
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
            connection.query("select CategoryName, h.ReceivingWarehouse, SUM(FailedCases) as FailedCases, Latitude, Longitude " +
                "from hackscdeidentified h, warehouseLocations w " +
                "where h.ReceivingWarehouse=w.ReceivingWareHouse " +
                "AND h.CategoryName=? " +
                "AND h.FailedCases>0 " +
                "GROUP BY h.ReceivingWarehouse, Latitude, Longitude " +
                "limit 100;", itemSearch,
                function (error, results, fields) {
                    if (error) {
                        console.log("error");
                        return;
                    }

                    //retrieve all warehouse locations that have the item we want
                    let warehouseLocations = [];

                    for (var i = 0; i < results.length; ++i) {
                        let coordinate = results[i].Latitude + ',' + results[i].Longitude;
                        warehouseLocations.push(coordinate);
                    }

                    const googleMapsClient = require("@google/maps").createClient({
                        key: key
                    });

                    googleMapsClient.distanceMatrix({
                        origins: clientLatLong,
                        destinations: warehouseLocations
                    }, function(err, response) {
                        let data = response.json;

                        let closeWarehouses = [];

                        //find the warehouses within 100km
                        for (let i = 0; i < data.rows[0].elements.length; ++i) {
                            if (data.rows[0].elements[i].distance.value < 100000) {
                                let distanceObject = data.rows[0].elements[i];

                                let warehouse = {
                                    address: data.destination_addresses[i],
                                    location: warehouseLocations[i],
                                    distance: {
                                        text: distanceObject.distance.text,
                                        value: distanceObject.distance.value
                                    },
                                    duration: {
                                        text: distanceObject.duration.text,
                                        value: distanceObject.duration.value
                                    },
                                    cases: results[i].FailedCases
                                };

                                closeWarehouses.push(warehouse);
                            }
                        }

                        res.send(closeWarehouses);
                    });
                });
        }
    });



});

module.exports = router;