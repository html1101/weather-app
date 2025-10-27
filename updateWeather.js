// Script to update the weather on our app.

/**
 * Given a latitude and longitude, return weather data
 * about that particular spot.
 */
const lookupLocation = async (lat, long) => {
    // Query the weather API here using the URL you constructed
    // (read the writeup for more details)
    // Make sure to use the latitude and longitude args (use a template string)!
    const weatherApi = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max&hourly=temperature_2m,weather_code,precipitation_probability&current=weather_code,temperature_2m,apparent_temperature,wind_speed_10m&timezone=auto&wind_speed_unit=mph&temperature_unit=fahrenheit`);
    // Parse as JSON
    const weatherJson = await weatherApi.json();
    
    // Parse the weather API's results here!
    // use stringifyWeatherCode to convert the weather codes to strings.

    // We've filled in the current weather for you
    // and the rest are all sample values;
    // fill in the rest here!
    return {
        "current_weather": {
            "weather": stringifyWeatherCode(weatherJson.current.weather_code),
            "temperature": weatherJson.current.temperature_2m,
            "chance_of_rain": weatherJson.hourly.precipitation_probability[0]
        },
        "todays_forecast": {
            "hourly_weather": weatherJson.hourly.weather_code.map(e => stringifyWeatherCode(e)),
            "hourly_temperature": weatherJson.hourly.temperature_2m,
            // The times have been done for you
            "times": weatherJson.hourly.time.map(parseTime)
        },
        "air_conditions": {
            "real_feel": weatherJson.current.apparent_temperature,
            "wind": weatherJson.current.wind_speed_10m,
            "rain_chance": weatherJson.hourly.precipitation_probability[0],
            "uv_index": weatherJson.daily.uv_index_max[0]
        },
        "week_forecast": {
            // The days have been done for you
            "days": listDays(),
            "weekly_weather": weatherJson.daily.weather_code,
            "low_temp": weatherJson.daily.temperature_2m_min,
            "high_temp": weatherJson.daily.temperature_2m_max
        }
    };
}

/**
 * Parse the weather code and turn it into a string.
 * Feel free to update this as you'd like (optional)!
 * Note, however, that this stringify corresponds
 * with the names in the weather-icons, so it makes our lives
 * easier when showing images.
 * 
 * @param {number} weatherCode The inputted weather code
 */
const stringifyWeatherCode = (weatherCode) => {
    // Mild weather
    if (weatherCode <= 1) return "sunny";
    else if (weatherCode == 2) return "cloudy";
    else if (weatherCode <= 50) return "overcast";

    // Snow + rain
    else if (weatherCode <= 70) return "rainy";
    else if (weatherCode <= 79) return "snow";

    // Snow + rain showers
    else if (weatherCode <= 83) return "rainy";
    else if (weatherCode <= 90) return "snow";

    // Thunder + hail
    else return "thunder";
}

/**
 * Update the weather we show on the interface.
 * @param {*} weather Weather in the format we return in lookupLocation.
 */
const updateWeather = (weather) => {
    // (1) Current weather section)
    const currentWeather = weather.current_weather;
    const currentWeatherElem = document.querySelector(".summary");
    
    // Show the image corresponding to the current weather
    const currentWeatherImg = currentWeatherElem.querySelector("img");
    currentWeatherImg.src = `./weather-icons/${currentWeather.weather}.png`;

    // Update the temperature for the current weather
    const currentTemp = currentWeatherElem.querySelector(".temp");
    currentTemp.innerHTML = currentWeather.temperature + "&deg;";

    // Chance of rain:
    const rainChance = document.querySelector(".rain-chance");
    rainChance.innerHTML = `Chance of rain: ${currentWeather.chance_of_rain}%`;


    // (2) Today's forecast section
    const todaysForecast = weather.todays_forecast;
    // Select all the hour elements in the today's forecast section
    const hourDivElements = document.querySelectorAll(".hourly-forecast > div");
    for(let i = 0; i < hourDivElements.length; i++) {
        // Update the image element for each hour
        const imgElem = hourDivElements[i].querySelector("img");
        imgElem.src = `./weather-icons/${todaysForecast.hourly_weather[i]}.png`;

        // Update the temperature element for each hour
        const hourElem = hourDivElements[i].querySelector(".temp");
        hourElem.innerHTML = `${todaysForecast.hourly_temperature[i]}&deg;`;

        // Update the time for each hour
        const timeElem = hourDivElements[i].querySelector("span");
        timeElem.innerHTML = todaysForecast.times[i];
    }


    // (3) 7-day forecast section
    // Your turn! Look at what was made already and apply it to this section.

    // (4) Air conditions section
    // Do the same for air conditions.
}

/**
 * Parse time in format 2025-10-22T01:00 to (ex.) 01:00 AM
 * This code's already been done for you, but feel free to poke around
 * 
 * @param {*} time Time string
 */
const parseTime = (time) => {
    return (new Date(time)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
const listDays = () => {
    // Get the day of the week (a code) + number after that
    const startDay = (new Date()).getDay();
    const days = ["Today"];
    for(let i = 1; i < 7; i++) {
        days.push(daysOfWeek[(startDay + i) % 7]);
    }
    return days;
}

/**
 * Populate results when typing in a location by making an API call
 * Feel free to poke around!
 * @param {*} query 
 */
const lookupLocationName = async (query) => {
    const { results } = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`).then(e => e.json());
    
    const resultListElem = document.querySelector(".location-results");
    // For each list of results, we have a name, latitude, and longitude
    for(let result of results) {
        const city = `${result.name} (${result.country_code})`;
        const newResult = document.createElement("div");
        newResult.className = "result";
        newResult.innerHTML = city;
        
        // If we click on this result, update our UI accordingly
        newResult.addEventListener("click", () => {
            lookupLocation(result.latitude, result.longitude)
                .then(weather => {
                    updateWeather(weather);
                    // Update the text to be the right city
                    document.querySelector(".summary .white").innerHTML = city;
                });

            // Clear out result list
            resultListElem.innerHTML = "";
        });

        // Add to result list in DOM
        resultListElem.appendChild(newResult);
    }
}

const locationInput = document.querySelector(".location-input");
locationInput.addEventListener("keydown", (evt) => {
    if(evt.key == "Enter") {
        lookupLocationName(locationInput.value);
    }
})


// Upon loading for the first time, get an estimation of their location using geocoding
const estimateLocation = async () => {
    const geoLoc = await fetch(`${location.protocol}//ip-api.com/json/`).then(response => response.json());
    
    const {lat, lon, countryCode, city} = geoLoc;
    lookupLocation(lat, lon)
    .then(weather => {
        document.querySelector(".summary .white").innerHTML = `${city} (${countryCode})`;
        updateWeather(weather);
    });
}

estimateLocation();

// Request user's location after they click the icon
document.querySelector(".nav-icon").addEventListener("click", () => {
    // See geolocation API docs: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API
    navigator.geolocation.watchPosition((position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        lookupLocation(lat, long)
        .then(weather => {
            document.querySelector(".summary .white").innerHTML = `City (${Math.round(lat*10)/10}, ${Math.round(long*10)/10})`;
            updateWeather(weather);
        });
    });
});