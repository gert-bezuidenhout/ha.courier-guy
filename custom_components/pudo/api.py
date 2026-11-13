"""Small client for the documented public tracking endpoint."""
import asyncio

from aiohttp import ClientError, ClientSession

from .const import BASE_URL


class CannotConnect(Exception):
    """The tracking service could not be reached."""


class NotFound(Exception):
    """No shipment exists for this reference."""


class PudoClient:
    def __init__(self, session: ClientSession, reference: str, reference_type: str):
        self.session = session
        self.reference = reference
        self.reference_type = reference_type

    async def async_track(self):
        try:
            async with asyncio.timeout(30):
                async with self.session.get(
                    f"{BASE_URL}/tracking/shipments",
                    params={"tracking_reference": self.reference},
                    allow_redirects=False,
                ) as response:
                    if response.status == 404:
                        raise CannotConnect
                    if response.status != 200:
                        raise CannotConnect
                    data = await response.json()
        except (ClientError, TimeoutError, ValueError) as err:
            raise CannotConnect from err
        if not isinstance(data, dict) or not isinstance(data.get("shipments"), list):
            raise CannotConnect
        if not data["shipments"]:
            raise NotFound
        data = data["shipments"][0]
        if not isinstance(data, dict) or not data.get("shipment_id"):
            raise CannotConnect
        if not isinstance(data.get("tracking_events"), (list, type(None))):
            raise CannotConnect
        return data
