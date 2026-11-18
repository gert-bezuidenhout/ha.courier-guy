# The Courier Guy / PUDO for Home Assistant

<img src="custom_components/pudo/brand/logo.png" alt="The Courier Guy" width="220">

Track Courier Guy and PUDO parcels in Home Assistant, with a dashboard card for adding waybills and viewing delivery updates.

[Home Assistant](https://www.home-assistant.io/) brings devices, services, dashboards and automations together. [The Courier Guy](https://thecourierguy.co.za/) and PUDO provide courier and parcel-locker services in South Africa.

This is an independent community integration maintained by Gert Bezuidenhout, not an official Courier Guy, PUDO or Home Assistant product.

## Features

- One device and two sensors per shipment: Status and Latest event.
- Five-minute polling and saved shipments across restarts.
- Dashboard entry/removal of waybills by administrators.
- Capitalised statuses and dates formatted using Home Assistant's timezone and language.

No API key is required. The integration uses public tracking; it does not discover account shipments, create bookings or cancel deliveries.

## Install with HACS

This integration is not yet included in the default Marketplace catalogue. Until catalogue acceptance, install as a custom repository:

1. Install and configure [HACS](https://www.hacs.xyz/docs/use/).
2. Open HACS > menu > **Custom repositories**.
3. Add `https://github.com/gert-bezuidenhout/ha.courier-guy` with type **Integration**.
4. Download **The Courier Guy / PUDO** and restart Home Assistant.
5. Open **Settings > Devices & services > Add integration > The Courier Guy / PUDO**. Enter a shipment, or leave the tracking reference blank to activate the dashboard without adding a parcel.

If your Marketplace offers **Add from a GitHub link**, use the same URL. No configuration.yaml changes are required. HACS includes the dashboard module and logo inside the integration.

## Dashboard card

The integration automatically serves and registers its frontend module. No Resources entry, file copy to `www`, or manual version URL is needed.

1. Configure the integration as described above, then refresh your browser or Companion app.
2. Edit a dashboard and choose **Add card**.
3. Search for **The Courier Guy / PUDO**. The selector shows a live card preview.
4. Select it and save. Alternatively add a **Manual** card:

```yaml
type: custom:pudo-tracking-card
```

As an administrator, enter a waybill and press **Track**. This creates the integration entry and sensors automatically. All cards show the same tracked shipments; do not add the same reference again through Settings.

Shipment details show a route from **Collection Hub → Delivery Hub**, with hub codes prominently displayed, a separate status badge, current location and readable dates. Each shipment has its own logo and administrator-only Remove action. Optional settings: `show_reference_type: true` shows the type selector; `reference_type: tracking_reference` defaults to parcel barcodes; `logo` overrides the bundled logo URL.

**Remove** asks for confirmation and deletes the Home Assistant entry and sensors from all cards. It does not cancel the courier shipment. Non-administrators can view existing data.

## Manual installation

Download the complete release ZIP, copy `custom_components/pudo/` to `/config/custom_components/pudo/`, restart and follow the card instructions above. Keep the folder name `pudo`.

## Sensors and privacy

| Sensor | Contents |
| --- | --- |
| Status | Status, hubs, service level and collection/delivery dates. |
| Latest event | Event status, message, location and timestamp. |

Raw values remain available to automations. Dates without a timezone retain their supplied time.

Recipient names, email addresses and phone numbers are not deliberately added as separate attributes. References, locations and free-text event messages can still contain private information. Redact these before sharing.

## Troubleshooting

- **Not found:** check the reference/type. Collection-code support is not guaranteed.
- **Already configured:** use the existing shipment entry.
- **Unavailable:** check connectivity and retry later; the public portal endpoint can change.
- **Custom element doesn't exist:** ensure at least one PUDO integration entry exists (a blank-reference Dashboard entry is sufficient), then refresh the browser or Companion app after restart.
- **Logo missing:** reinstall the integration including its bundled `www` folder. Local integration branding requires Home Assistant 2026.3 or newer.

## Updates and removal

### Tracking notifications

Version 0.4.0 emits `pudo_tracking_updated` only when a parcel's status or latest tracking event changes. It covers all configured waybills, including ones added later. Identical polling responses and initial startup do not emit events. Failed requests retain the previous successful snapshot; changes found after recovery are reported. Updates while Home Assistant is stopped become the startup baseline and are not reported retrospectively.

Use [the notification automation](docs/examples/pudo-notification-automation.yaml) with your existing `script.notification_all`. Copy its contents into an automation's **Edit in YAML** editor. Adjust the notification action if you use a different script. Disable or replace any old automation listening to the global `state_changed` event; it wakes for unrelated changes throughout Home Assistant.

Update the integration and restart before enabling the new automation. No dashboard update is required for this fix.

Update through HACS and restart, then refresh your browser. Keep existing entries. Card updates and cache versioning are managed by the integration automatically. Legacy `/local/pudo/pudo-tracking-card.js` resources may be removed as optional cleanup; no edits to them are required. See [MIGRATION.md](MIGRATION.md).

To uninstall, remove tracked entries, uninstall in HACS, remove unused cards/resources and restart. Review automations using the removed sensors.

## Support and files

Use [GitHub Issues](https://github.com/gert-bezuidenhout/ha.courier-guy/issues) with versions, reproduction steps and redacted logs. Never publish real waybills or recipient details.

See [repository files](docs/FILES.md), [technical details](docs/DETAILS.md), [release notes](docs/releases/) and [Marketplace preparation](docs/HACS_SUBMISSION.md).

## Licence

Original code is under the [MIT licence](LICENSE), copyright Gert Bezuidenhout. Courier Guy and PUDO names and artwork remain subject to their owners' rights, outside the project's code licence.
