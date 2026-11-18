"""Coordinator event contract tests without a Home Assistant installation."""
import importlib.util
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import AsyncMock, Mock, patch

ROOT = Path(__file__).resolve().parents[1] / "custom_components" / "pudo"


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


class TrackingTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        package = types.ModuleType("tracking_test_package")
        package.__path__ = [str(ROOT)]
        api = types.ModuleType("tracking_test_package.api")
        api.CannotConnect = type("CannotConnect", (Exception,), {})
        api.NotFound = type("NotFound", (Exception,), {})
        helper = types.ModuleType("homeassistant.helpers.update_coordinator")

        class CoordinatorStub:
            def __init__(self, hass, *args, **kwargs):
                self.hass = hass

        helper.DataUpdateCoordinator = CoordinatorStub
        helper.UpdateFailed = type("UpdateFailed", (Exception,), {})
        self.modules = patch.dict(sys.modules, {
            "tracking_test_package": package,
            "tracking_test_package.api": api,
            "homeassistant": types.ModuleType("homeassistant"),
            "homeassistant.helpers": types.ModuleType("homeassistant.helpers"),
            "homeassistant.helpers.update_coordinator": helper,
        })
        self.modules.start()
        self.addCleanup(self.modules.stop)
        load_module("tracking_test_package.tracking", ROOT / "tracking.py")
        self.module = load_module("tracking_test_package.coordinator", ROOT / "coordinator.py")
        self.client = types.SimpleNamespace(reference="EXAMPLE", async_track=AsyncMock())
        self.hass = types.SimpleNamespace(bus=types.SimpleNamespace(async_fire=Mock()))
        self.coordinator = self.module.PudoCoordinator(self.hass, object(), self.client)

    def response(self, location="JNB", date="2026-01-01T10:00:00Z"):
        return {"status": "collected", "tracking_events": [
            {"status": "collected", "date": date, "location": location, "message": ""}]}

    async def test_initial_and_identical_updates_are_silent(self):
        self.client.async_track.return_value = self.response()
        await self.coordinator._async_update_data()
        await self.coordinator._async_update_data()
        self.hass.bus.async_fire.assert_not_called()

    async def test_same_status_new_event_fires_once(self):
        self.client.async_track.return_value = self.response()
        await self.coordinator._async_update_data()
        self.client.async_track.return_value = self.response("PTA", "2026-01-01T11:00:00Z")
        await self.coordinator._async_update_data()
        await self.coordinator._async_update_data()
        self.hass.bus.async_fire.assert_called_once()
        event_type, payload = self.hass.bus.async_fire.call_args.args
        self.assertEqual(event_type, "pudo_tracking_updated")
        self.assertEqual(payload["reference"], "EXAMPLE")
        self.assertEqual(payload["location"], "PTA")

    async def test_failure_preserves_snapshot_and_recovery_reports_change(self):
        self.client.async_track.return_value = self.response()
        await self.coordinator._async_update_data()
        self.client.async_track.side_effect = self.module.CannotConnect()
        with self.assertRaises(self.module.UpdateFailed):
            await self.coordinator._async_update_data()
        self.hass.bus.async_fire.assert_not_called()
        self.client.async_track.side_effect = None
        self.client.async_track.return_value = self.response("PTA")
        await self.coordinator._async_update_data()
        self.hass.bus.async_fire.assert_called_once()

    async def test_status_only_change_and_unrelated_fields(self):
        data = self.response()
        self.client.async_track.return_value = data
        await self.coordinator._async_update_data()
        data["unrelated"] = "new"
        await self.coordinator._async_update_data()
        self.hass.bus.async_fire.assert_not_called()
        data["status"] = "delivered"
        await self.coordinator._async_update_data()
        self.hass.bus.async_fire.assert_called_once()
