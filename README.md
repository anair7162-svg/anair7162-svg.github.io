# eLearns.io — v2.1

NSW Learner & Provisional Route Builder. GPS-tracked practice drives,
wizard-built loop routes, and a 120-hour logbook.

## Contents

```
elearns-io/
├── index.html          ← Entry point
├── manifest.json       ← PWA manifest
├── css/
│   └── styles.css      ← All styling, animations, theme variables
└── js/
    ├── icons.js        ← Inline SVG icon library (loads first)
    ├── config.js       ← toast(), $(), persistence helpers, Supabase endpoints
    ├── state.js        ← S object, bottom nav, tab routing, GPS arrow icon
    ├── auth.js         ← Sign-in / sign-up / session restore, local-first hydration
    ├── theme.js        ← Dark/light toggle, weather rendering
    ├── search.js       ← Nominatim autocomplete, waypoints
    ├── wizard.js       ← Route-builder wizard (required + optional roads)
    ├── routes.js       ← Route generation, POI landmarks, exact-geometry persistence
    ├── nav.js          ← Turn-by-turn navigation, GPS tracking, GM-suggestion modal wiring
    └── data.js         ← Logbook, routes list, profile, modals, legacy handling
```

## Running locally

No build step. Serve the folder with any static file server and
open `index.html`.

```
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

## Script load order

`index.html` loads scripts in dependency order. Do not reorder them.

```
leaflet → icons → config → state → auth → theme →
search → wizard → routes → nav → data
```

---

## What changed in v2.1

### Persistence & data integrity

* **Logbook entries now always persist.** Every entry is written to
  localStorage immediately (under `el_logs_<uid|guest>`) and, if
  signed in, also to Supabase. Refresh or reopen — nothing is lost.
* **Routes store their exact geometry at creation time.** `saveRt()`
  generates a stable local ID before the Supabase round-trip, writes
  the full polyline/steps/waypoints to `el_rt_geo_<id>`, and upgrades
  the key once Supabase returns a server-side ID. Reloading a saved
  route replays the exact path — never regenerates.
* **Legacy routes (pre-v2.1) are tagged `LEGACY`** with an amber
  left-border card and an archive icon. Clicking one opens the Legacy
  Route panel with preserved settings and a "Rebuild Similar Route"
  button — no silent regeneration of a different path.

### Distance input

* Manual "Log Drive Session" button → distance field starts **empty**.
* Auto-fill only when logging a generated route or after in-app
  navigation — in which case the route distance (or GPS-tracked
  distance if available) is prefilled and editable.

### Logbook detail popup

* Click any logbook entry to open the detail modal with animated
  slide-in. Shows date, duration, km, supervisor, roads, notes.
* If the entry has an attached route, a full-width "View Route"
  button loads the **exact** saved geometry into the map.

### Map marker

* The old teal / themed "start" dot is gone. The only user-position
  marker is the blue directional GPS arrow, which rotates to match
  GPS heading.
* **New arrow design:** outlined white circle with a gradient-filled
  triangle and white stroke — no longer a solid filled dot.

### UI / UX

* **Start Drive confirmation modal.** Clicking Start Drive now opens
  a popup recommending Google Maps. Three options:
    - *Open in Google Maps* — launches the route in Google Maps and
      marks the drive pending for auto-log-prompt on return.
    - *Use in-app navigator* — continues with the existing in-app nav.
    - *Back to route options* — dismisses the modal.
* **Wizard road types split into Core + Optional.**
    - Core (required, at least one must be selected): Residential,
      Main Roads, Multi-Lane.
    - Optional (lighter styling, fully optional): Roundabouts,
      Parking, Hills.
    - Trying to proceed without a core road type shows a validation
      toast.
* **Smooth slider animations.** Range thumbs now use spring easing
  (`cubic-bezier(.34,1.56,.64,1)`), scale on hover/active, and have
  animated glow shadows.
* **Route fade-in animation** when routes are drawn on the map.
* **Polished detail-modal entry animation** and close-button rotation.
* All inline code comments removed for production readability.

## Brand palette

```
--acc  #22d89e   (teal green — primary)
--acc2 #1bc98f
--w    #f0a040   (amber — warning / legacy)
--d    #f05050   (red — danger)
--i    #4d9eff   (blue — GPS / info)
--p    #9d7aff   (purple — accent)
```

Licence-theme variants (L = yellow, P1 = red, P2 = teal) cascade
through all interactive elements.

## Local storage keys

```
el_tk, el_rt, el_uid          Supabase session
el_logs_<uid|guest>           Logbook entries (JSON array)
el_routes_<uid|guest>         Route list metadata (JSON array)
el_rt_geo_<routeId>           Full route geometry + settings (JSON)
el_log_rt_<logEntryId>        Route attached to a log entry (JSON)
ll-pfp                        Profile picture (base64)
el_tut_seen                   Tutorial dismissed flag
```
