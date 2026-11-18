"""Coordinate tracking updates."""
from datetime import timedelta
import logging

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import CannotConnect, NotFound
from .tracking import tracking_snapshot


class PudoCoordinator(DataUpdateCoordinator):
    def __init__(self, hass, entry, client):
        super().__init__(hass, logging.getLogger(__name__), name="PUDO tracking",
                         config_entry=entry, update_interval=timedelta(minutes=5))
        self.client = client
        self._previous_tracking = None

    async def _async_update_data(self):
        try:
            data = await self.client.async_track()
        except (CannotConnect, NotFound) as err:
            raise UpdateFailed("Unable to retrieve shipment tracking") from err
        snapshot = tracking_snapshot(data, self.client.reference)
        if self._previous_tracking is not None and snapshot != self._previous_tracking:
            self.hass.bus.async_fire("pudo_tracking_updated", snapshot)
        self._previous_tracking = snapshot
        return data
