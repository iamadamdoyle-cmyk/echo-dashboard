ECHO SHOW DASHBOARD — VERSION 1
Prepared and sources checked: October 12, 2026

START HERE

This is a static clock/date/weather page for a 960 x 480 Echo Show 5.
It keeps the stock OS and Alexa. It does not become the system Home screen.
The silent audio is an experiment to keep the foreground browser active.
Continuous operation on your H23K37 must be tested on the actual device.

Configured for Cherry Hill, NJ (city-level coordinates), Fahrenheit,
America/New_York, and 12-hour time. Change config.js if needed. All files and
configuration on this site are public. No street address is included.

FILES

echo-dashboard/
  index.html                 Complete page markup
  styles.css                 Layout, typography and fit-to-viewport styling
  config.js                  Location, units, clock and keep-awake settings
  app.js                     Clock, weather, cache and audio diagnostics
  .nojekyll                  Tells Pages to serve static files without Jekyll
  README.txt                 This setup and test guide
  assets/
    silence.mp3              Included, original silent audio (~30 seconds)
  tools/
    make-silence.ps1          Optional reproducible audio generator

No build process, framework, npm packages, API key, or third-party JavaScript.
Upload the CONTENTS of this folder into the repository root, not a nested copy
of the echo-dashboard folder. Never upload the ZIP as the website itself.

WHAT IS CONFIRMED, AND WHAT IS EXPERIMENTAL

Documented: Amazon's Silk guide supports browsing on Echo Show and HTML audio,
including MP3. It says background audio pauses when a tab loses focus. The guide
describes Silk generally; it does not guarantee kiosk operation on this model.
https://docs.aws.amazon.com/pdfs/silk/latest/developerguide/silk-dg.pdf

Developer-listed: MyPage by XdreaM opens saved URLs, provides a page-list editor,
and warns of an inactivity timeout of about five minutes. The US listing was
confirmed in your signed-in Chrome session and MyPage was enabled successfully.
The developer's own editor says about ten minutes, reinforcing that the actual
timeout needs to be measured on your device.
https://skills-store.amazon.co.uk/deeplink/dp/B09CG879RG
https://www.amazon.com/dp/B09CG879RG

Community workaround: Robert Morris reports successful silent MP3 looping on an
Echo Show 5 in September 2026, including GitHub hosting. That is first-person
evidence, not Amazon support, and does not identify your firmware version.
https://www.patreon.com/MechanicalWhispers/posts/amazon-echo-show-170148198

Not established: guaranteed 24/7 display, automatically resuming audio after
every Alexa interaction, or a stock Routine trigger for device reboot/browser
dismissal. No such trigger was found in the current official Routine material.
Use the voice restore routine and optionally a scheduled restore below.
https://developer.amazon.com/en-US/alexa/alexa-haus/routines

1. CONFIGURE THE DASHBOARD

Open config.js in a text editor (Notepad is sufficient). Set:
  locationName: the city label to display
  latitude, longitude: city-level decimal coordinates; west longitude is negative
  timeZone: an IANA zone, e.g. America/New_York
  temperatureUnit: fahrenheit or celsius
  hour12: true for 12-hour time, false for 24-hour time

Use city-level coordinates, not a street address. No geolocation permission is
requested. The named zone controls both displayed date/time and forecast day.
The device must have an accurate system clock; DST follows its time-zone data.

Weather uses the credential-free Open-Meteo forecast endpoint. Default polling is
every 15 minutes (roughly 96 successful polls/day per continuously open device).
Failed requests retry after one minute, or after 15 minutes for rate limiting.
Current conditions are weather-model estimates, not a sensor reading from your
house; High/Low are the daily forecast maximum/minimum. Data are rounded on screen.
https://open-meteo.com/en/docs

The free endpoint allows noncommercial personal use under its usage limits.
Weather attribution is included on the screen. Keep it when editing the design.
https://open-meteo.com/en/terms

On a brief outage the last usable weather remains with a Stale label. Data older
than two hours or for a previous date are hidden. Clock/audio keep running as long
as the page remains loaded. This is not an offline-installed app: a new page load
still needs access to GitHub Pages. There is no service worker or auto page reload.

2. CREATE THE GITHUB REPOSITORY AND PUBLISH

1) Sign in to github.com. If needed, create your own account and verify its email.
2) Click + at the top, then New repository. Choose your personal account as owner.
3) Name: echo-dashboard. Choose Public for the free Pages path. Initialize with
   a README so a main branch exists, then click Create repository.
4) In the repository's Code tab, choose Add file > Upload files. Drag in the
   extracted folder CONTENTS, including assets and tools. Commit to main.
   index.html, styles.css, config.js and app.js must be at the top level.
5) Check that assets/silence.mp3 exists. If the uploader misses the dotfile,
   use Add file > Create new file, name it .nojekyll, enter a blank line, commit.
6) Open Settings > Pages. Under Build and deployment set Source to Deploy from
   a branch, Branch to main, Folder to / (root), then Save.
7) Wait for the Pages deployment to finish. Actions shows its status. The Pages
   settings screen will supply the real URL. Allow up to ten minutes for updates.
8) Open https://YOUR-USERNAME.github.io/echo-dashboard/ in your desktop browser.
   Use the actual username, no angle brackets. Keep the trailing slash.
9) Leave Enforce HTTPS enabled when available. Verify the time, full date, current
   weather, high and low. Tap Start silent audio if it appears.

GitHub documents branch publication and free public-repository Pages hosting:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

This publishes static files only. There are no secrets to configure. If a future
provider requires a secret key, use a server/serverless proxy with a secret store
and caching, or generate sanitized JSON server-side. Pages cannot keep a browser
API key secret. Private calendars and family data need a separate access design.

3. CONFIGURE MYPAGE ON THE ECHO

1) In the Alexa phone app, using the same Amazon account as the Echo, open
   More > Skills & Games. Search MyPage; select the skill by XdreaM; enable it.
   Availability and menu wording can vary by marketplace and Alexa version.
2) Say: "Alexa, open My Page and show page list."
3) In Page 1, enter your complete HTTPS GitHub Pages address. Name it Dashboard.
   For the first test, append: ?test=1&awake=0&weather=0
4) Press Save on the page list. Then say:
   "Alexa, open My Page and show page 1."
5) After testing, edit Page 1 to the normal address without test parameters.
   "Alexa, open My Page" recalls the last page; an explicit page number is more
   predictable if you later add other pages.

These commands and the Save step come from the skill developer's listing:
https://skills-store.amazon.co.uk/deeplink/dp/B09CG879RG

If the skill is unavailable, test the page through "Alexa, open Silk" and enter
the HTTPS address manually. That checks the dashboard, but does not replace a
working MyPage voice/routine launcher. Do not assume a different skill is equal.

4. TEST IN STAGES — CHANGE ONE THING AT A TIME

Keep restore schedules disabled during the idle tests. Reopening the page on a
schedule would hide a failure of the keep-awake method. After starting a test,
leave the display alone: taps and Alexa commands invalidate a passive idle test.

A) Baseline, clock only; no audio
   URL suffix: ?test=1&awake=0&weather=0
   Confirm time/date and no scrolling. Audio must read Disabled. Observe from
   another clock for 20-30 minutes; record when Home returns, if it does.
   The five-minute listing is approximate; do not assume one universal timeout.

B) Clock plus audio
   URL suffix: ?test=1&weather=0
   Tap Start silent audio if shown. Within a few seconds Audio should read
   advancing. Its position must change, wrap about every 30 seconds, and the
   loops count must increase. Check it has wrapped at least twice.
   Then leave it untouched for 30 minutes, then two hours, then overnight.
   Keep the same device settings/environment used for the baseline.

C) Add weather
   URL suffix: ?test=1
   Confirm actual local weather and High/Low, and repeat the idle test. Verify
   the Updated age returns near zero after a weather refresh. Check the full
   date and daily forecast after midnight, too.

D) Check normal Alexa behavior
   Ask a question; run a usual smart-home command; set a one-minute timer and
   let it ring; dismiss it; play music and stop it. Test calls if you use them.
   After each, note whether the dashboard returns and audio resumes. Use the
   restore routine and tap Resume silent audio if needed. Music/calls may take
   audio focus. The page deliberately does not repeatedly force audio to restart.

E) Reboot recovery
   Reboot normally. After Alexa is ready, run the voice restore routine. Note
   whether it opens the page and whether a physical tap is still required.
   Separately test the scheduled routine a few minutes in the future.

F) Normal display
   Remove the suffix from Page 1 and Save. The diagnostics disappear. When audio
   plays, its button and status disappear. A Start/Resume button reappears only
   when necessary; no permanent dashboard controls are shown.

Record: firmware/Silk version, test URL, start time, first Home return, page-age
counter, audio advancing/paused, loops, Alexa interaction, and any reboot.
Audio advancing proves playback, NOT prevention of Amazon's Home timeout. Only
the physical unattended A/B test can establish that for your Echo.

5. CREATE A RESTORE ROUTINE

Manual restore after Home, a reboot, or another skill:
1) Alexa app > More > Routines > +.
2) Name: Restore Dashboard.
3) Add an event (older app wording: When this happens) > Voice.
4) Phrase: restore dashboard.
5) Add an action > Custom (may be labeled Customized).
6) Enter WITHOUT the wake word: open My Page and show page 1
7) Choose Preview this action if available. Select your Echo Show 5 in the
   device/From/respond-from field, not your phone or another Echo. Save.
8) On the Echo say: "Alexa, restore dashboard."

Use a Custom action. Alexa Says would speak the words instead of executing them.
Keep the launcher as the only action for Version 1. If it fails, first test the
same command aloud and use the wording Alexa actually understands.
https://digprjsurvey.amazon.co.uk/csad/help/node/GLXY7RFX3L5GH2VR
https://digprjsurvey.amazon.co.uk/csad/help/node/G2PYLKJN3XVZ55EQ

Optional scheduled recovery AFTER the idle test passes:
Create a second routine named Morning Dashboard. Event: Schedule > At Time,
07:00 AM, Every Day. Action: the same Custom command. Device: your Echo Show 5.
Use a time when you normally want the dashboard. This reopens it at the next
scheduled event; it is not an on-boot or on-browser-dismissal trigger, and a missed
event while the Echo is offline is not a recovery guarantee. A routine also does
not provide a webpage tap or override a blocked autoplay policy.

6. SILENT AUDIO — ALREADY INCLUDED

Use assets/silence.mp3 as supplied. It is an original generated silent MP3,
approximately 30 seconds, mono, MPEG-1 Layer III, 44.1 kHz, 128 kbit/s, no metadata.
The browser loops it locally. A 30-second duration reduces how often loop
boundaries occur compared with a one-second file; improved keep-awake reliability
is not assumed. The bundled generator can reproduce it from the project folder:

  powershell -NoProfile -File .\tools\make-silence.ps1

The generator writes only assets/silence.mp3. No downloaded audio or encoder is
required. If your PowerShell policy disallows scripts, simply use the included
MP3; there is no need to change the policy.

Conventional alternative, with FFmpeg installed from https://ffmpeg.org/download.html:

  ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 30 -c:a libmp3lame -b:a 128k -map_metadata -1 assets/silence-new.mp3

Set audioFile in config.js to assets/silence-new.mp3 after uploading it. This
command creates a new file and does not overwrite the supplied audio. FFmpeg's
anullsrc is documented here: https://ffmpeg.org/ffmpeg-filters.html#anullsrc

The AUDIO CONTENT is silent. The element intentionally is not muted and its
volume is not zero, because those are different browser playback states. This
does not set the Echo's system volume. Do not mute the whole device to hide audio;
that would also affect normal Alexa output. Do not substitute an audible file.

An autoplay attribute alone is not evidence of playback. JavaScript calls play(),
handles rejection and displays a tap-to-start control. Chromium documents user
activation restrictions; actual Silk enforcement must be tested on the Echo.
https://developer.chrome.com/blog/autoplay/

7. TROUBLESHOOTING

Home returns and audio was not advancing:
  Open ?test=1 again. Tap Start/Resume. Confirm position and loop count change.
  Tap required / NotAllowedError means autoplay was denied, not a broken clock.
  A voice launch is not necessarily a browser user gesture; a tap may be required
  on each new session. Repeated play() calls cannot promise to remove that limit.

Audio file error:
  Open your Pages URL followed by assets/silence.mp3 on a desktop. Confirm it
  loads as an audio file, not a GitHub HTML page or a 404. Paths are case-sensitive.
  The audio must be inside assets, not alongside it. Media error 2 typically
  indicates a network problem, 3 decoding, and 4 unsupported source. Try the
  conventional FFmpeg-generated file if Silk cannot decode the included MP3.

Home returns even while audio advances:
  Confirm schedules were disabled and there was no Alexa interaction. Record the
  elapsed time and firmware/Silk version. Retest once after a normal restart.
  If repeatable, the workaround is not effective on this firmware. A stock web
  page cannot overrule the Echo system's foreground policy. Scheduled/manual
  reopening is a fallback, not proof of uninterrupted operation. Do not invest
  in more dashboard features until this core test is acceptable to you.

Returns after music, calls, a timer, another skill, or Settings:
  The Echo may have interrupted playback or closed Silk. Restore the page and
  resume audio. This tradeoff is why the page doesn't run an aggressive restart
  loop that could compete with normal Alexa audio.

Wrong/blank weather:
  Check config.js coordinates, unit and timeZone; also the Echo's clock and Wi-Fi.
  Open-Meteo must be reachable from Silk. Wait through the retry interval. A Stale
  label is intentional; yesterday's daily values are not presented as today's.
  Browser developer tools on a desktop can show API/CORS/network errors. A desktop
  success does not prove the Echo's network or browser settings are equivalent.

Pages 404 or old version:
  Check main + /(root), completed Pages deployment, index.html at root and correct
  username/repository URL. Reload after deployment. For an edit, increment ?v=1
  on the changed CSS/JS reference in index.html to ?v=2, then publish and reload.
  Existing open pages do not automatically download changed code. Avoid clearing
  all Silk data as a first step, because that can remove site state/bookmarks.

Cut-off text, small text, or browser toolbar:
  The physical panel is 960 x 480, but Silk may expose fewer CSS pixels due to
  scaling and browser chrome. ?test=1 shows the real viewport. The fixed design
  uniformly fits that viewport; no scroll or forced fullscreen API is required.
  Begin at normal zoom/default browsing mode. Try Silk's desktop mode only if
  the layout is wrong and that option exists. Exact toolbar/fullscreen behavior
  is firmware-specific. The page cannot hide all Amazon system UI.

MyPage fails but direct Silk URL works:
  Check skill availability/enabled state, same account, the saved URL and Save.
  Test explicit page 1 by voice. This isolates the launcher from the webpage.
  A service outage or skill retirement cannot be repaired by changing the HTML.

8. COMPATIBILITY AND LIMITS

Designed around the supplied H23K37 / 960 x 480 requirement. We did not infer
firmware, browser build or guaranteed behavior from the model number alone.
The page uses classic scripts, ES5-style syntax, XMLHttpRequest, basic flexbox,
system fonts and local assets. It needs JavaScript and Intl time-zone formatting.
No Web Audio, Screen Wake Lock, service worker, fullscreen API, synthetic touch,
iframe keep-alive service, or automatic refresh is needed in normal operation.

A standards-based screen wake lock, when available, requests that a display stay
awake; it does not establish permission to keep Silk foregrounded by Fire OS.
Animations, JavaScript clock ticks and weather requests likewise are not proof
of user activity. This implementation relies on the separately tested media
workaround, not on promises about those mechanisms.

Alexa remains installed and available. Preserving it does not mean the browser
will remain visible through every Alexa feature. Home content can still appear
whenever Home regains the screen; ads inside other services are unaffected.
Firmware updates can change behavior. Re-run the idle and Alexa-interaction tests
after an update. No firmware changes or ad-server blocking are part of this setup.

LOCAL VERIFICATION

See the separate verification report supplied with the ZIP for completed checks.
GitHub deployment, account-specific skill activation, routine execution, and Echo
idle/reboot/Alexa tests remain device/account tests until you perform them.
