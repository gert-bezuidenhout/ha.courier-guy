"""Coordinate tracking updates."""
from datetime import timedelta
import logging

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import CannotConnect, NotFound


class PudoCoordinator(DataUpdateCoordinator):
    def __init__(self, hass, entry, client):
        super().__init__(hass, logging.getLogger(__name__), name="PUDO tracking",
                         config_entry=entry, update_interval=timedelta(minutes=5))
        self.client = client

    async def _async_update_data(self):
        try:
            return await self.client.async_track()
        except (CannotConnect, NotFound) as err:
            raise UpdateFailed("Unable to retrieve shipment tracking") from err
