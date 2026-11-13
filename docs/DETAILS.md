# Tracking API and validation

Requests use GET https://api.portal.thecourierguy.co.za/tracking/shipments with the tracking_reference parameter for both types. This is the endpoint used by the public portal, not a documented stability guarantee. No account authentication or bookings are implemented.

Malformed responses/service failures make entities unavailable; an empty shipments list means not found. False/missing statuses become unknown. Polling runs every five minutes.

The bundled logo derives from the [official SVG](https://thecourierguy.co.za/wp-content/uploads/2025/03/tcg-logo.svg). Artwork rights remain with the owner.

Run `python -m unittest discover -s tests -v` and `node tests/test_card.cjs`. These checks cover the HTTP contract and errors, formatting, admin checks, add/remove, cancellation and failures. They do not make live requests or run a complete Home Assistant instance. Syntax, HACS and Hassfest run in GitHub Actions.

The user confirmed 0.3.0 working in Home Assistant. This packaging release preserves runtime behaviour; a fresh install/upgrade check on the target system remains useful.
