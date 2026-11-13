"""The Courier Guy / PUDO tracking integration."""
from homeassistant.const import Platform
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import PudoClient
from .const import CONF_REFERENCE, CONF_REFERENCE_TYPE
from .coordinator import PudoCoordinator

PLATFORMS = [Platform.SENSOR]


async def async_setup_entry(hass, entry):
    client = PudoClient(async_get_clientsession(hass), entry.data[CONF_REFERENCE],
                        entry.data[CONF_REFERENCE_TYPE])
    coordinator = PudoCoordinator(hass, entry, client)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass, entry):
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
