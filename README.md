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

Default catalogue submission remains deferred. Install as a custom repository:

1. Install and configure [HACS](https://www.hacs.xyz/docs/use/).
2. Open HACS > menu > **Custom repositories**.
3. Add `https://github.com/gert-bezuidenhout/ha.courier-guy` with type **Integration**.
4. Download **The Courier Guy / PUDO** and restart Home Assistant.
5. Install the card below, or add a shipment through **Settings > Devices & services > Add integration > The Courier Guy / PUDO**.

If your Marketplace offers **Add from a GitHub link**, use the same URL. No configuration.yaml changes are required. HACS installs only the integration, not the card.

## Dashboard card

1. Download the installation ZIP from the [latest release](https://github.com/gert-bezuidenhout/ha.courier-guy/releases/latest).
2. Copy `www/pudo/` from the ZIP to `/config/www/pudo/`, including JavaScript and logo. Restart if creating `/config/www/` for the first time.
3. Enable **Advanced mode** in your profile. Open **Settings > Dashboards > menu > Resources**.
4. Add `/local/pudo/pudo-tracking-card.js?v=0.3.1` as a **JavaScript module**. Edit an existing PUDO resource rather than adding a duplicate.
5. Add a **Manual** card:

```yaml
type: custom:pudo-tracking-card
```

As an administrator, enter a waybill and press **Track**. This creates the integration entry and sensors automatically. All cards show the same tracked shipments; do not add the same reference again through Settings.

Optional settings: `show_reference_type: true` shows the type selector; `reference_type: tracking_reference` defaults to parcel barcodes; `logo` overrides the local logo URL.

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
- **Custom element doesn't exist:** check the JavaScript module resource and refresh the browser or Companion app.
- **Logo missing:** copy `tcg-logo.svg` alongside the card. Local integration branding requires Home Assistant 2026.3 or newer.

## Updates and removal

Update through HACS and restart. Keep existing entries. Update card files separately from the release ZIP and refresh. See [MIGRATION.md](MIGRATION.md).

To uninstall, remove tracked entries, uninstall in HACS, remove unused cards/resources and restart. Review automations using the removed sensors.

## Support and files

Use [GitHub Issues](https://github.com/gert-bezuidenhout/ha.courier-guy/issues) with versions, reproduction steps and redacted logs. Never publish real waybills or recipient details.

See [repository files](docs/FILES.md), [technical details](docs/DETAILS.md), [release notes](docs/releases/) and [Marketplace preparation](docs/HACS_SUBMISSION.md).

## Licence

Original code is under the [MIT licence](LICENSE), copyright Gert Bezuidenhout. Courier Guy and PUDO names and artwork remain subject to their owners' rights, outside the project's code licence.
