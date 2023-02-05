let weatherAPIkey = "cd2aa67983e7278c8d98f9af911b874f";
let weatherBaseEndPoint =
  "https://api.openweathermap.org/data/2.5/weather?appid=" +
  weatherAPIkey +
  "&units=metric";

let forecastBaseEndPoint =
  "https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=" +
  weatherAPIkey;

let geocodingBaseEndPoint =
  "http://api.openweathermap.org/geo/1.0/direct?limit=5&appid=" +
  weatherAPIkey +
  "&q=";

let reverseGeocodingEndpoint = "http://api.openweathermap.org/geo/1.0/reverse?appid="+ weatherAPIkey;

// references of all html elements which will be needed.
// ==================================================================================================

let datalist = document.querySelector("#suggestions");
let searchInp = document.querySelector(".weather_search");
let city = document.querySelector(".weather_city");
let day = document.querySelector(".weather_day");
let humidity = document.querySelector(".weather_indicator--humidity>.value");
let wind = document.querySelector(".weather_indicator--wind>.value");
let pressure = document.querySelector(".weather_indicator--pressure>.value");
let temperature = document.querySelector(".weather_temperature>.value");
let image = document.querySelector(".weather_image");
let forecastBlock = document.querySelector(".weather_forecast");

let weatherImages = [
  {
    url: "images/broken-clouds.png",
    ids: [803, 804],
  },
  {
    url: "images/clear-sky.png",
    ids: [800],
  },
  {
    url: "images/few-clouds.png",
    ids: [801],
  },
  {
    url: "images/mist.png",
    ids: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781],
  },
  {
    url: "images/rain.png",
    ids: [500, 501, 502, 503, 504],
  },
  {
    url: "images/scattered-clouds.png",
    ids: [802],
  },
  {
    url: "images/shower-rain.png",
    ids: [520, 521, 522, 531, 300, 301, 302, 310, 311, 312, 313, 314, 321],
  },
  {
    url: "images/snow.png",
    ids: [511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622],
  },
  {
    url: "images/thunderstorm.png",
    ids: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232],
  },
];

//===================================================================================================

let getWeatherByCityName = async (city) => {
  let endPoint = weatherBaseEndPoint + "&q=" + city;
  let response = await fetch(endPoint);
  let weather = await response.json();
  return weather;
};

let getForecastByCityId = async (id) => {
  let endPoint = forecastBaseEndPoint + "&id=" + id;
  let result = await fetch(endPoint);
  let forecast = await result.json();

  let forecastList = forecast.list;
  let daily = [];

  forecastList.forEach((day) => {
    let date_txt = day.dt_txt;
    date_txt = date_txt.replace(" ", "T");
    let date = new Date(date_txt);
    let hours = date.getHours();
    if (hours === 12) {
      daily.push(day);
    }
  });
  return daily;
};

let updateCurrentWeather = (data) => {
  city.innerText = data.name;
  day.innerText = dayOfWeek();
  humidity.innerText = data.main.humidity;
  pressure.innerText = data.main.pressure;

  let windDirection;
  let deg = data.wind.deg;
  if (deg > 45 && deg <= 135) windDirection = "East";
  else if (deg > 135 && deg <= 225) windDirection = "South";
  else if (deg > 225 && deg <= 315) windDirection = "West";
  else windDirection = "North";

  wind.innerText = windDirection + "," + data.wind.speed;
  temperature.innerText =
    data.main.temp > 0
      ? `+${Math.round(data.main.temp)}`
      : Math.round(data.main.temp);

  let imgID = data.weather[0].id;
  weatherImages.forEach((obj) => {
    if (obj.ids.indexOf(imgID) != -1) {
      image.src = obj.url;
    }
  });
};

let dayOfWeek = (dt = new Date().getTime()) => {
  // if(dt===undefined){
  //   dt = new Date().getTime();
  // }
  let today = new Date(dt).toLocaleDateString("en-EN", { weekday: "long" });
  return today;
};

let weatherForCity = async (city) => {
  let weather = await getWeatherByCityName(city);

  if (weather.cod === "404") {
    Swal.fire({
      icon: "error",
      title: "OOPs....",
      text: "You typed wrong city name",
    });
    return;
  }

  updateCurrentWeather(weather);
  let cityId = weather.id;
  let forecast = await getForecastByCityId(cityId);
  updateForecast(forecast);
};

searchInp.addEventListener("keydown", async (e) => {
  if (e.keyCode === 13) {
    weatherForCity(searchInp.value);
  }
});

searchInp.addEventListener("input", async () => {
  if (searchInp.value.length <= 2) {
    return;
  }
  let endPoint = geocodingBaseEndPoint + searchInp.value;
  let result = await fetch(endPoint);
  result = await result.json();

  datalist.innerHTML = "";
  result.forEach((city) => {
    let option = document.createElement("option");
    option.value = `${city.name}${city.state ? "," + city.state : ""},${
      city.country
    }`;
    datalist.appendChild(option);
  });
});

let updateForecast = (forecast) => {
  forecastBlock.innerHTML = "";
  let forecastItem = "";
  forecast.forEach((day) => {
    let temperature =
      day.main.temp > 0
        ? `+${Math.round(day.main.temp)}`
        : Math.round(day.main.temp);

    let dayName = dayOfWeek(day.dt * 1000);

    let iconUrl =
      "http://openweathermap.org/img/wn/" + day.weather[0].icon + "@2x.png";

    forecastItem += ` <article class="col-sm-5 col-md-3 col-lg-2 weather_forecast_item mb-3">
    <img
      src="${iconUrl}"
      alt="${day.weather[0].description}"
      class="weather_forecast_icon mb-4"
    />
    <h3 class="weather_forecast_day mb-4">${dayName}</h3>
    <p class="weather_forecast_temperature">
      <span class="value">${temperature}</span> &deg;C
    </p>
  </article>`;
  });

  forecastBlock.innerHTML = forecastItem;
};

//=================================================================================================
//For getting current location and displaying current locations forecast 
//on page load our showLocation() function will be executed


let getLatiLongi = () => {
  let options = {
    enableHighFrequency: true,
    timeout: 5000,
    maximumAge: 0,
  };

  let cordArr = navigator.geolocation.getCurrentPosition(locationGotSuccess,failedToGetLocation,options);
};

let showLocation = () => {
  let cordinates = getLatiLongi();
};

let locationGotSuccess = async (pos)=>{
  let crd = pos.coords;
  let lat = crd.latitude.toString();
  let longi = crd.longitude.toString();
  // console.log(lat,longi);
  
  let endPoint = reverseGeocodingEndpoint + "&lat=" + lat +"&lon="+longi;
  let result = await fetch(endPoint);
  result = await result.json();
  // console.log(result[0].name);
  Swal.fire({
    icon : "success",
    title : `Got your Location : ${result[0].name}`
  })
  weatherForCity(result[0].name);

}

let failedToGetLocation = (error)=>{
  console.log(error);
}