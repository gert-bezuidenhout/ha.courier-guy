"""Serve and register the bundled dashboard module."""
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.loader import async_get_integration


async def async_register_frontend(hass):
    """Use the integration version to refresh frontend caches automatically."""
    integration = await async_get_integration(hass, "pudo")
    await hass.http.async_register_static_paths([
        StaticPathConfig("/pudo_static", str(Path(__file__).parent / "www"), False)
    ])
    frontend.add_extra_js_url(
        hass, f"/pudo_static/pudo-tracking-card.js?v={integration.version}"
    )
