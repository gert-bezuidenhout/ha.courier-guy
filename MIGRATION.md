# Updating The Courier Guy / PUDO

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
