(function () {
  "use strict";
  var cfg = window.DASHBOARD_CONFIG;
  var el = function (id) { return document.getElementById(id); };
  var query = window.location.search;
  function flag(name, value) { return new RegExp("(?:[?&])" + name + "=" + value + "(?:&|$)").test(query); }
  var debug = flag("test", "1");
  var audioEnabled = cfg.keepAwake && !flag("awake", "0");
  var weatherEnabled = cfg.weatherEnabled && !flag("weather", "0");
  var startedAt = Date.now();
  var audio = el("keep-alive");
  var lastAudioTime = -1, lastAdvance = 0, loops = 0, mediaError = "";
  var audioState = audioEnabled ? "Starting" : "Disabled";
  var weather = null, weatherError = "", inFlight = false, nextFetch = 0;
  var refreshMs = Math.max(5, Number(cfg.weatherRefreshMinutes) || 15) * 60000;
  var cacheKey = "echo-v1:" + [cfg.latitude, cfg.longitude, cfg.timeZone, cfg.temperatureUnit].join(":");
  var clockFormat, weekdayFormat, dateFormat, dayFormat;
  var clockOK = true;
  try {
    clockFormat = new Intl.DateTimeFormat("en-US", {timeZone: cfg.timeZone, hour: "numeric", minute: "2-digit", hour12: cfg.hour12});
    weekdayFormat = new Intl.DateTimeFormat("en-US", {timeZone: cfg.timeZone, weekday: "long"});
    dateFormat = new Intl.DateTimeFormat("en-US", {timeZone: cfg.timeZone, month: "long", day: "numeric", year: "numeric"});
    dayFormat = new Intl.DateTimeFormat("en-US", {timeZone: cfg.timeZone, month: "2-digit", day: "2-digit", year: "numeric"});
  } catch (e) {
    clockOK = false;
    el("weekday").textContent = "Check time zone";
    el("date").textContent = "Silk needs Intl time-zone support";
  }
  function todayKey(date) {
    if (!clockOK) { return ""; }
    var parts = dayFormat.format(date).match(/\d+/g);
    return parts[2] + "-" + parts[0] + "-" + parts[1];
  }
  function fit() {
    // Keep all three thirds across the full width when Silk leaves 380px high.
    var height = Math.max(380, Math.min(480, window.innerHeight * 960 / window.innerWidth));
    var scale = Math.min(window.innerWidth / 960, window.innerHeight / height);
    el("dashboard").style.height = height + "px";
    el("dashboard").style.transform = "translate(-50%, -50%) scale(" + scale + ")";
  }
  fit();
  window.addEventListener("resize", fit);
  el("location").textContent = cfg.locationName.toUpperCase();
  el("unit").textContent = cfg.temperatureUnit === "celsius" ? "°C" : "°F";
  if (debug) {
    el("diagnostics").hidden = false;
    document.body.className = "testing";
  }

  function number(value) { return typeof value === "number" && isFinite(value); }
  function temp(value) { return number(value) ? Math.round(value) + "°" : "--"; }
  function condition(code) {
    var labels = {0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Freezing fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Freezing drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Freezing rain",71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Rain showers",81:"Rain showers",82:"Heavy showers",85:"Snow showers",86:"Heavy snow",95:"Thunderstorm",96:"Storm with hail",99:"Storm with hail"};
    return Object.prototype.hasOwnProperty.call(labels, code) ? labels[code] : "Conditions unavailable";
  }
  function validWeather(w) {
    return w && number(w.temperature) && number(w.code) && number(w.high) && number(w.low) && number(w.fetchedAt) && number(w.observedAt) && typeof w.day === "string";
  }
  function renderWeather() {
    if (!weatherEnabled) {
      el("condition").textContent = "Clock-only test";
      el("weather-status").textContent = "Weather disabled for this test";
      return;
    }
    var age = weather ? Math.max(Date.now() - weather.fetchedAt, Date.now() - weather.observedAt) : Infinity;
    // Never pass an old forecast off as today's weather after midnight or a long outage.
    if (!weather || weather.day !== todayKey(new Date()) || age > 2 * 3600000) {
      el("temperature").textContent = "--";
      el("high").textContent = "--";
      el("low").textContent = "--";
      el("condition").textContent = weatherError || (weather ? "Weather unavailable" : "Loading weather");
      el("weather-status").textContent = weatherError || weather ? "Waiting for fresh weather" : "";
      return;
    }
    el("temperature").textContent = Math.round(weather.temperature);
    el("condition").textContent = condition(weather.code);
    el("high").textContent = temp(weather.high);
    el("low").textContent = temp(weather.low);
    var minutes = Math.max(0, Math.floor((Date.now() - weather.fetchedAt) / 60000));
    el("weather-status").textContent = weatherError || age > 45 * 60000 ? "Stale · last fetch " + minutes + "m ago" : "Updated " + (minutes < 1 ? "just now" : minutes + "m ago");
  }
  function fetchWeather() {
    if (!weatherEnabled || !clockOK || inFlight || Date.now() < nextFetch) { return; }
    if (!number(cfg.latitude) || !number(cfg.longitude) || Math.abs(cfg.latitude) > 90 || Math.abs(cfg.longitude) > 180) {
      weatherError = "Check coordinates"; nextFetch = Date.now() + refreshMs; renderWeather(); return;
    }
    inFlight = true;
    var xhr = new XMLHttpRequest();
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + encodeURIComponent(cfg.latitude) +
      "&longitude=" + encodeURIComponent(cfg.longitude) +
      "&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min" +
      "&temperature_unit=" + encodeURIComponent(cfg.temperatureUnit) +
      "&timezone=" + encodeURIComponent(cfg.timeZone) + "&forecast_days=1";
    function failure(message, retryMs) {
      inFlight = false; weatherError = message; nextFetch = Date.now() + (retryMs || 60000); renderWeather();
    }
    xhr.open("GET", url, true);
    xhr.timeout = 15000;
    xhr.onload = function () {
      if (xhr.status !== 200) { failure("Weather unavailable", xhr.status === 429 ? refreshMs : 60000); return; }
      try {
        var data = JSON.parse(xhr.responseText);
        var c = data.current, d = data.daily;
        var index = d.time.indexOf(todayKey(new Date()));
        var t = c.time.match(/\d+/g);
        var observedAt = Date.UTC(+t[0], +t[1] - 1, +t[2], +t[3], +t[4]) - data.utc_offset_seconds * 1000;
        var candidate = {temperature:c.temperature_2m, code:c.weather_code, high:d.temperature_2m_max[index], low:d.temperature_2m_min[index], day:d.time[index], fetchedAt:Date.now(), observedAt:observedAt};
        if (index < 0 || !validWeather(candidate)) { throw new Error("Incomplete weather response"); }
        weather = candidate; weatherError = ""; inFlight = false; nextFetch = Date.now() + refreshMs;
        try { localStorage.setItem(cacheKey, JSON.stringify(weather)); } catch (ignore) { /* Cache is optional. */ }
        renderWeather();
      } catch (e) { failure("Weather unavailable"); }
    };
    xhr.onerror = function () { failure("Weather unavailable"); };
    xhr.ontimeout = function () { failure("Weather unavailable"); };
    xhr.send();
  }
  try {
    var cached = JSON.parse(localStorage.getItem(cacheKey));
    if (validWeather(cached)) { weather = cached; }
  } catch (ignore) { /* Clock/audio work even if storage is disabled. */ }

  function showStart(label) {
    el("start-audio").textContent = label;
    el("start-audio").hidden = !audioEnabled;
  }
  function startAudio() {
    if (!audioEnabled) { return; }
    mediaError = ""; audioState = "Starting";
    audio.muted = false;
    audio.volume = 1; // The FILE is silent. This does not change Echo system volume.
    var result;
    try {
      result = audio.play();
      if (result && typeof result.then === "function") {
        result.then(function () { el("start-audio").hidden = true; }, function (err) {
          audioState = err.name === "NotAllowedError" ? "Tap required" : "Playback error";
          mediaError = err.name;
          showStart("Start silent audio");
        });
      }
    } catch (err) { audioState = "Playback error"; mediaError = err.name; showStart("Retry silent audio"); }
  }
  if (audioEnabled) {
    audio.src = cfg.audioFile;
    audio.addEventListener("playing", function () {
      audioState = "Playing";
      el("start-audio").hidden = true;
    });
    audio.addEventListener("timeupdate", function () {
      if (audio.currentTime !== lastAudioTime) {
        if (lastAudioTime >= 0 && audio.currentTime < lastAudioTime - 0.5) { loops++; }
        lastAudioTime = audio.currentTime; lastAdvance = Date.now();
        if (!audio.paused) { audioState = "Playing"; el("start-audio").hidden = true; }
      }
    });
    audio.addEventListener("pause", function () { audioState = "Paused"; showStart("Resume silent audio"); });
    audio.addEventListener("error", function () {
      audioState = "Audio file error"; mediaError = "Media code " + (audio.error ? audio.error.code : "unknown");
      showStart("Retry silent audio");
    });
    // No periodic restart: respect Alexa music, calls, timers and an explicit Stop.
    el("start-audio").addEventListener("click", function () { if (audio.error) { audio.load(); } startAudio(); });
    el("pause-audio").addEventListener("click", function () { audio.pause(); });
    startAudio();
  } else { el("pause-audio").hidden = true; }

  var previousDay = "";
  function tick() {
    var now = new Date();
    if (clockOK) {
      var clockText = clockFormat.format(now);
      var period = clockText.match(/AM|PM/i);
      el("clock").textContent = clockText.replace(/\s*(AM|PM)/i, "");
      el("period").textContent = period ? period[0] : "";
      el("weekday").textContent = weekdayFormat.format(now);
      el("date").textContent = dateFormat.format(now);
      var day = todayKey(now);
      if (previousDay && day !== previousDay) { nextFetch = 0; }
      previousDay = day;
    }
    renderWeather(); fetchWeather();
    var advancing = audioEnabled && !audio.paused && lastAdvance > 0 && Date.now() - lastAdvance < 5000;
    if (audioEnabled && !audio.paused && !advancing && Date.now() - startedAt > 10000) {
      audioState = "Not advancing"; showStart("Retry silent audio");
    }
    el("audio-indicator").textContent = audioEnabled ? (advancing ? "" : "Silent audio: " + audioState.toLowerCase()) : "";
    if (debug) {
      var elapsed = Math.floor((Date.now() - startedAt) / 1000);
      el("diagnostic-text").textContent = "Page " + Math.floor(elapsed / 60) + "m " + elapsed % 60 + "s | " + window.innerWidth + "×" + window.innerHeight + " CSS px\n" +
        "Audio: " + (advancing ? "advancing" : audioState) + " | " + audio.currentTime.toFixed(1) + " / " + (isFinite(audio.duration) ? audio.duration.toFixed(1) : "?") + "s | loops " + loops + "\n" +
        "Visible: " + !document.hidden + " | muted: " + audio.muted + (mediaError ? " | " + mediaError : "");
    }
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { tick(); fit(); } });
  window.addEventListener("online", function () { nextFetch = 0; fetchWeather(); });
  tick();
  setInterval(tick, 1000);
}());
