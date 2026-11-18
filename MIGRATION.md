# Updating The Courier Guy / PUDO

## From 0.5.0 to 0.5.1

Update through HACS, restart Home Assistant and refresh your browser or Companion app. The dashboard now uses the approved Route layout with prominent hub codes, a directional arrow, status badge, current location and labeled dates. Keep existing card YAML, resources and shipments; no manual resource URL changes are needed.

## From 0.4.x to 0.5.0

Update through HACS, restart Home Assistant and refresh your browser or Companion app. Existing dashboard YAML, shipments and sensors remain valid. The frontend module and logo are now included in `custom_components/pudo/www` and registered automatically, with cache versioning tied to the integration release. Do not copy new dashboard files or change Resource URLs.

Old `/local/pudo/pudo-tracking-card.js` resource entries may remain; the managed module upgrades the existing card definition if an older script loads first. Removing old resources is optional cleanup. The integration must have at least one entry to load on startup. New users can submit a blank tracking reference to create a Dashboard entry, then add parcels from the card.

The card selector now shows a live preview, and shipment details label Location, Collection Hub and Delivery Hub explicitly.

## From 0.3.x to 0.4.0

Update through HACS and restart Home Assistant. Keep existing entries, sensors and dashboard files.

Disable the previous notification automation listening for all `state_changed` events. Replace its YAML with [docs/examples/pudo-notification-automation.yaml](docs/examples/pudo-notification-automation.yaml), which listens only to the integration's `pudo_tracking_updated` event. It uses `script.notification_all`; adapt that action to your own notification setup if needed. The new event requires version 0.4.0 or later.

No notification is sent when an entry first loads or when an unchanged response is polled. Current and future tracked waybills are covered automatically.

## From 0.3.0 to 0.3.1

The integration domain remains `pudo`. Keep existing integration entries; do not delete and recreate them to update. Entity identities and polling behaviour are unchanged.

Download through HACS, or replace `/config/custom_components/pudo/` with the folder from the release ZIP, then restart Home Assistant.

Copy the ZIP's `www/pudo/` into `/config/www/pudo/`. Edit the existing dashboard resource to `/local/pudo/pudo-tracking-card.js?v=0.3.1` (JavaScript module), then refresh your browser. Saved shipments remain configured. Removing a shipment from the card deletes its Home Assistant entry and sensors, not the courier shipment.

## Moving a manual install to HACS

Back up Home Assistant, add this repository to HACS as an Integration, then download it and restart. Keep the same integration domain and configuration entry. Verify your sensors and dashboards afterwards. HACS manages only the integration folder; dashboard files are updated separately.
