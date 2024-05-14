const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const YELP_API_KEY = 'pxpuU19gDhxBiwnQ4shNHcjX-WOCHr7hy5O6LIvqR38leKvabywinbTNsfSuEG2baO_TIXbSEH7-Mi_fvVF-rGZkF9YmiQeBlUn2cQdhmQNDuLBJXJp1xClUiqzPZXYx';

let currentPage = 0; //Initial page
const pageSize = 50; //Max number of items per request
let totalResults = 0; //Initial amount of restaurants before api call
let allResults = []; //Store all restaurants in array


//Enable CORS for all routes
app.use(cors());
//Parse JSON bodies
app.use(express.json());

// Define route for Yelp API proxy

app.get('/restaurants', async (req, res) => {
    const { latitude, longitude } = req.query;

    try {
        
        // Make initial request to get total results
        const initialResponse = await axios.get('https://api.yelp.com/v3/businesses/search', {
            params: {
                latitude,
                longitude,
                limit: pageSize, //Determines the amount of restaurants per request, in this case 50. 
                radius: 5000, //Default 5000 meter radius.
                offset: currentPage * pageSize //Offset determines the range of restaurants per request. 
            },                                 //Offset 0 will return restaurants from 1 to 50, including 50.
                                            //Offset 50 will return restaurants from 51 to 100, including 100.
            headers: {                          
                Authorization: `Bearer ${YELP_API_KEY}`,
            }
        });

        totalResults = initialResponse.data.total; //total amount of results
        console.log('Total Restaurants found: ' + totalResults);

        // Fetch all results by paginating through the data
        //Yelp has restriction that limit + offset must be < 1000. It is built into the Fusion API.
        //Making Business Search endpoint requests where limit+offset>1000 currently will return an error message with that explanation.
        while (currentPage * pageSize < totalResults && (currentPage * pageSize) + pageSize < 1000) { //Check if there are more results and fits within Yelp's restrictions
            console.log("Page: ", currentPage + "   offset:" + currentPage * pageSize );
        
            const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
                params: {
                    latitude,
                    longitude,
                    limit: pageSize,
                    radius: 5000,
                    offset: currentPage * pageSize 
                },
                headers: {
                    Authorization: `Bearer ${YELP_API_KEY}`,
                }
            });

            allResults = allResults.concat(response.data.businesses); //Add restaurants to array
            currentPage++; //Go to next page
        }

        res.send(allResults);
        
    } catch (error) {
        console.error('Error fetching data from Yelp API:', error);
        if (error.response && error.response.status === 500) {
            res.status(500).send('Yelp API Internal Server Error');
        } else {
            res.status(500).send('Error fetching data from Yelp API');
        }
    }
});



//Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});