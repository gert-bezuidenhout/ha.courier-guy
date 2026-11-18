"""Test integration-managed module registration without Home Assistant."""
import importlib.util
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import AsyncMock, Mock, patch


class FrontendTests(unittest.IsolatedAsyncioTestCase):
    async def test_bundled_module_uses_integration_version(self):
        add_module = Mock()
        frontend = types.SimpleNamespace(add_extra_js_url=add_module)
        http = types.ModuleType("homeassistant.components.http")
        http.StaticPathConfig = lambda url, path, cache: (url, path, cache)
        loader = types.ModuleType("homeassistant.loader")
        loader.async_get_integration = AsyncMock(return_value=types.SimpleNamespace(version="0.5.2"))
        components = types.ModuleType("homeassistant.components")
        components.frontend = frontend
        with patch.dict(sys.modules, {
            "homeassistant": types.ModuleType("homeassistant"),
            "homeassistant.components": components,
            "homeassistant.components.http": http,
            "homeassistant.loader": loader,
        }):
            path = Path(__file__).resolve().parents[1] / "custom_components/pudo/frontend.py"
            spec = importlib.util.spec_from_file_location("pudo_frontend_test", path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            hass = types.SimpleNamespace(http=types.SimpleNamespace(async_register_static_paths=AsyncMock()))
            await module.async_register_frontend(hass)
            add_module.assert_called_once_with(hass, "/pudo_static/pudo-tracking-card.js?v=0.5.2")
            configs = hass.http.async_register_static_paths.call_args.args[0]
            self.assertEqual(configs[0][0], "/pudo_static")
            self.assertFalse(configs[0][2])
            for filename in ("pudo-tracking-card.js", "tcg-logo.svg"):
                self.assertTrue((Path(configs[0][1]) / filename).is_file())
