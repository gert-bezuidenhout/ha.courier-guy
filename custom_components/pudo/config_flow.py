"""Configure a tracked shipment from the UI."""
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import CannotConnect, NotFound, PudoClient
from .const import CONF_REFERENCE, CONF_REFERENCE_TYPE, DOMAIN


class PudoConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input is not None:
            reference = user_input[CONF_REFERENCE].strip()
            kind = user_input[CONF_REFERENCE_TYPE]
            if not reference:
                errors[CONF_REFERENCE] = "invalid_reference"
            else:
                await self.async_set_unique_id(f"{kind}:{reference.casefold()}")
                self._abort_if_unique_id_configured()
                try:
                    await PudoClient(async_get_clientsession(self.hass), reference, kind).async_track()
                except CannotConnect:
                    errors["base"] = "cannot_connect"
                except NotFound:
                    errors["base"] = "not_found"
                else:
                    return self.async_create_entry(title=reference, data={
                        CONF_REFERENCE: reference, CONF_REFERENCE_TYPE: kind})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({
            vol.Required(CONF_REFERENCE_TYPE, default="waybill"): vol.In({
                "waybill": "Shipment waybill", "tracking_reference": "Parcel barcode"}),
            vol.Required(CONF_REFERENCE): str,
        }), errors=errors)
