(function () {
  "use strict";
  var cfg = window.DASHBOARD_CONFIG || {};
  var key = "echo-sixers-v1", cache = null, failed = false, busy = false, nextFetch = 0;
  var refreshMs = Math.max(15, Number(cfg.sixersRefreshMinutes) || 60) * 60000;
  var maxAge = 24 * 60 * 60000;
  var dateFormat, timeFormat, dayFormat;
  function text(id, value) { document.getElementById(id).textContent = value; }
  try {
    dateFormat = new Intl.DateTimeFormat("en-US", {timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", year: "numeric"});
    timeFormat = new Intl.DateTimeFormat("en-US", {timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true});
    dayFormat = new Intl.DateTimeFormat("en-US", {timeZone: "America/New_York", month: "2-digit", day: "2-digit", year: "numeric"});
  } catch (e) {
    text("game-matchup", "Schedule unavailable");
    text("game-status", "Silk needs time-zone support");
    return;
  }
  function dayKey(date) {
    var p = dayFormat.format(date).match(/\d+/g);
    return p[2] + "-" + p[0] + "-" + p[1];
  }
  function seasonYear() {
    var p = dayFormat.format(new Date()).match(/\d+/g);
    return Number(p[2]) + (Number(p[0]) >= 7 ? 1 : 0);
  }
  function normalize(event, seasonType) {
    var c = (event.competitions || [])[0];
    if (!c) { return null; }
    var status = (c.status || {}).type || {};
    var statusName = status.name || "";
    if (status.completed || status.state !== "pre" || /POSTPON|CANCEL|SUSPEND/i.test(statusName)) { return null; }
    var teams = c.competitors || [], own = null, other = null;
    for (var i = 0; i < teams.length; i++) {
      if (String((teams[i].team || {}).id) === "20") { own = teams[i]; }
      else { other = teams[i]; }
    }
    if (!own || !other || !other.team) { return null; }
    var start = Date.parse(c.date || event.date);
    if (!isFinite(start)) { return null; }
    var opponent = other.team;
    return {
      start: start,
      day: dayKey(new Date(start)),
      tbd: c.timeValid === false || event.timeValid === false || /TBD/i.test(statusName),
      city: opponent.location || "",
      name: opponent.shortDisplayName || opponent.displayName || "Opponent TBD",
      home: own.homeAway === "home",
      neutral: !!c.neutralSite,
      kind: Number((event.seasonType || {}).type) || seasonType
    };
  }
  function upcoming(games) {
    var now = Date.now(), today = dayKey(new Date(now));
    for (var i = 0; i < games.length; i++) {
      if (games[i].tbd ? games[i].day >= today : games[i].start > now) { return games[i]; }
    }
    return null;
  }
  function render() {
    var valid = cache && cache.year === seasonYear() && Date.now() - cache.fetchedAt <= maxAge;
    var game = valid ? upcoming(cache.games) : null;
    if (!game) {
      text("game-matchup", valid && !failed ? "Schedule not announced" : "Schedule unavailable");
      text("game-opponent", ""); text("game-date", ""); text("game-time", ""); text("game-kind", "");
      text("game-status", valid && !failed ? "Checking for the next game" : "Will retry automatically");
      return;
    }
    text("game-matchup", (game.home || game.neutral ? "vs " : "at ") + game.city);
    text("game-opponent", game.name);
    text("game-date", dateFormat.format(new Date(game.start)));
    text("game-time", game.tbd ? "Time TBD" : timeFormat.format(new Date(game.start)) + " ET");
    var kind = game.kind === 1 ? "Preseason" : game.kind === 3 ? "Playoffs" : "Regular season";
    text("game-kind", (game.neutral ? "Neutral site" : game.home ? "Home" : "Away") + " · " + kind);
    text("game-status", failed ? "Cached · update unavailable" : "");
  }
  function refresh() {
    if (busy) { return; }
    busy = true;
    var year = seasonYear(), remaining = 3, games = [], batchFailed = false;
    function finish(ok, data, type) {
      if (!ok) { batchFailed = true; }
      else {
        for (var i = 0; i < data.events.length; i++) {
          var game = normalize(data.events[i], type);
          if (game) { games.push(game); }
        }
      }
      remaining--;
      if (remaining) { return; }
      busy = false;
      failed = batchFailed;
      if (!failed) {
        games.sort(function (a, b) { return a.start - b.start; });
        cache = {year: year, fetchedAt: Date.now(), games: games};
        try { localStorage.setItem(key, JSON.stringify(cache)); } catch (e) { /* Optional cache. */ }
      }
      nextFetch = Date.now() + (failed ? 15 * 60000 : refreshMs);
      render();
    }
    function request(type) {
      var xhr = new XMLHttpRequest(), done = false;
      function complete(ok, data) {
        if (done) { return; }
        done = true;
        finish(ok, data, type);
      }
      xhr.open("GET", "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/20/schedule?season=" + year + "&seasontype=" + type, true);
      xhr.timeout = 15000;
      xhr.onload = function () {
        try {
          var data = JSON.parse(xhr.responseText);
          complete(xhr.status >= 200 && xhr.status < 300 && String((data.team || {}).id) === "20" && Array.isArray(data.events), data);
        } catch (e) { complete(false); }
      };
      xhr.onerror = xhr.ontimeout = xhr.onabort = function () { complete(false); };
      try { xhr.send(); } catch (e) { complete(false); }
    }
    // Include preseason, regular season and playoffs; do not assume the current phase.
    request(1); request(2); request(3);
  }
  try {
    var saved = JSON.parse(localStorage.getItem(key));
    if (saved && Array.isArray(saved.games) && isFinite(saved.fetchedAt)) { cache = saved; failed = true; }
  } catch (e) { /* Storage can be unavailable in Silk. */ }
  if (cache) { render(); }
  refresh();
  setInterval(function () {
    render();
    if (Date.now() >= nextFetch || (cache && cache.year !== seasonYear())) { refresh(); }
  }, 60000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { render(); if (Date.now() >= nextFetch) { refresh(); } }
  });
}());
