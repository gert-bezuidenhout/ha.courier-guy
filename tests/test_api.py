"""Offline transport contract tests; no Home Assistant installation required."""
import asyncio
import importlib
from pathlib import Path
import sys
import types
import unittest

package = types.ModuleType("pudo")
package.__path__ = [str(Path(__file__).resolve().parents[1] / "custom_components" / "pudo")]
sys.modules["pudo"] = package
aiohttp = types.ModuleType("aiohttp")
aiohttp.ClientError = type("ClientError", (Exception,), {})
aiohttp.ClientSession = object
sys.modules["aiohttp"] = aiohttp
api = importlib.import_module("pudo.api")


class Response:
    def __init__(self, status, data):
        self.status, self.data = status, data

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def json(self):
        return self.data


class Session:
    def __init__(self, response):
        self.response = response

    def get(self, url, **kwargs):
        self.request = (url, kwargs)
        return self.response


class ApiTests(unittest.IsolatedAsyncioTestCase):
    async def test_documented_request_and_false_status(self):
        session = Session(Response(200, {"shipments": [{"shipment_id": 984, "status": False, "tracking_events": []}]}))
        result = await api.PudoClient(session, "ABC_001", "tracking_reference").async_track()
        self.assertIs(result["status"], False)
        self.assertEqual(session.request[1]["params"], {"tracking_reference": "ABC_001"})
        self.assertFalse(session.request[1]["allow_redirects"])

    async def test_missing_and_malformed_shipments(self):
        for status, data, error in (
            (404, {}, api.CannotConnect), (429, {}, api.CannotConnect),
            (500, {}, api.CannotConnect), (200, [], api.CannotConnect),
            (200, {}, api.CannotConnect), (200, {"shipments": []}, api.NotFound),
            (200, {"shipments": [{}]}, api.CannotConnect),
            (200, {"shipments": [{"shipment_id": 1, "tracking_events": {}}]}, api.CannotConnect),
        ):
            with self.subTest(status=status, data=data), self.assertRaises(error):
                await api.PudoClient(Session(Response(status, data)), "ABC", "waybill").async_track()


if __name__ == "__main__":
    unittest.main()
