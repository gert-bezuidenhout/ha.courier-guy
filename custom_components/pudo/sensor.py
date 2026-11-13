"""Shipment status and latest event sensors."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, CONF_REFERENCE


def latest_event(data):
    """Select the most recent timestamp, independent of API ordering."""
    events = [event for event in data.get("tracking_events") or [] if isinstance(event, dict)]
    return max(events, key=lambda event: str(event.get("date") or ""), default={})


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([PudoSensor(entry, key) for key in ("status", "latest_event")])


class PudoSensor(CoordinatorEntity, SensorEntity):
    _attr_has_entity_name = True

    def __init__(self, entry, key):
        super().__init__(entry.runtime_data)
        self.key = key
        self.reference = entry.data[CONF_REFERENCE]
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_name = "Status" if key == "status" else "Latest event"
        self._attr_icon = "mdi:package-variant" if key == "status" else "mdi:truck-delivery"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=f"PUDO {entry.data[CONF_REFERENCE]}", manufacturer="The Courier Guy",
            model="Shipment tracking")

    @property
    def native_value(self):
        data = self.coordinator.data
        value = data.get("status") if self.key == "status" else latest_event(data).get("status")
        return value[:255] if isinstance(value, str) and value else None

    @property
    def extra_state_attributes(self):
        data = self.coordinator.data
        if self.key == "latest_event":
            event = latest_event(data)
            return {"pudo_reference": self.reference, "pudo_role": self.key,
                    **{key: event.get(key) for key in ("date", "message", "location")}}
        return {"pudo_reference": self.reference, "pudo_role": self.key,
                **{key: data.get(key) for key in (
            "custom_tracking_reference", "collection_hub", "delivery_hub",
            "service_level_code", "shipment_collected_date", "shipment_delivered_date")}}
