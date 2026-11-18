# Tracking API and validation

Requests use GET https://api.portal.thecourierguy.co.za/tracking/shipments with the tracking_reference parameter for both types. This is the endpoint used by the public portal, not a documented stability guarantee. No account authentication or bookings are implemented.

Malformed responses/service failures make entities unavailable; an empty shipments list means not found. False/missing statuses become unknown. Polling runs every five minutes.

The bundled logo derives from the [official SVG](https://thecourierguy.co.za/wp-content/uploads/2025/03/tcg-logo.svg). Artwork rights remain with the owner.

Run `python -m unittest discover -s tests -v` and `node tests/test_card.cjs`. These checks cover the HTTP contract and errors, formatting, admin checks, add/remove, cancellation and failures. They do not make live requests or run a complete Home Assistant instance. Syntax, HACS and Hassfest run in GitHub Actions.

The user confirmed tracking working in Home Assistant. Version 0.5.0 adds automatic frontend registration using Home Assistant's extra module URL mechanism and an integration-served static asset directory. The module URL includes the integration version and static caching is disabled to prevent stale upgrades. The selector enables Home Assistant's live card preview. A Dashboard entry without a reference can activate the frontend before tracking any parcels.

Regression tests cover static asset registration, the bundled module matching the compatibility copy, labeled shipment details, preview mode avoiding mutations, and upgrading a card definition loaded earlier from a legacy manual resource. These are isolated contract tests; a complete Home Assistant frontend upgrade still needs confirmation on the target installation.
