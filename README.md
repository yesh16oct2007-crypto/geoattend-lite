# GeoAttend Lite — deployable build (live sync on every device)

Zero dependencies. Needs only Node.js 18+. Faculty on one phone and students on any other phone
see the same session, code and roster in real time (Server-Sent Events). No Claude account needed.

## Run locally
    npm start        # then open http://localhost:3000

## Deploy (pick one, all free tiers work)
**Render**: New > Web Service > connect this folder's repo > Build: (blank) > Start: `npm start`.
**Railway**: New Project > Deploy from repo > it detects `npm start` automatically.
**Any VPS / college server**: `PORT=80 node server.js` (put it behind HTTPS).

Phones only allow GPS on **HTTPS** pages. Render and Railway give you HTTPS automatically.

## Data
Stored in `data/db.json`. Set `DATA_DIR` to a persistent volume if your host wipes the disk on redeploy.

## Notes
- Demo faculty login: faculty@campus.edu / faculty123 (or register a new faculty account).
- Passwords are hashed in the browser; this is demo-grade. For production, hash and verify on the
  server and re-run the geofence validator server-side so clients can't bypass it.
