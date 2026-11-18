/* The Courier Guy / PUDO dashboard card. No external dependencies. */
class PudoTrackingCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}ha-card{display:block;border-radius:9px;overflow:hidden}
        .body{padding:18px 20px;color:var(--primary-text-color,#151515)}
        .card-heading{display:flex;align-items:center;gap:16px;margin-bottom:14px}
        .card-heading img{display:block;width:105px;max-width:35%;height:auto;flex:none}
        h3{font-size:17px;font-weight:700;margin:0}
        form{display:grid;gap:12px}.kind{display:grid;gap:6px;font-size:13px}.kind[hidden]{display:none}
        .search{display:flex;align-items:center;gap:10px;border:1px solid var(--divider-color,#d2d7e3);border-radius:28px;padding:6px;box-shadow:0 1px 2px #0000000c}
        .search svg{width:19px;height:19px;flex:none;margin-left:10px;color:var(--secondary-text-color,#333)}
        input,select,button{font:inherit;box-sizing:border-box}
        input{flex:1;width:0;min-width:0;padding:7px 0;border:0;outline:none;background:transparent;color:inherit;font-size:14px}
        .search:focus-within{outline:2px solid #284795;outline-offset:2px}input::placeholder{color:var(--secondary-text-color,#8290ac)}
        select{padding:8px;border-radius:8px;background:var(--card-background-color,white);color:inherit;border:1px solid var(--divider-color,#ddd)}
        button{border:0;border-radius:22px;padding:7px 19px;background:#2b4b98;color:white;cursor:pointer;font-size:14px;font-weight:600}button:disabled{opacity:.55;cursor:wait}
        .shipments{display:grid;gap:14px;margin-top:14px}.shipments:empty{display:none}
        .shipment{box-sizing:border-box;min-width:0;border:1px solid var(--divider-color,#ddd);border-left:3px solid var(--primary-color,#2b4b98);border-radius:10px;padding:14px;background:color-mix(in srgb,var(--primary-text-color,#151515) 3%,var(--card-background-color,#fff))}
        .shipment-header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;margin-bottom:10px}
        .shipment-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;margin-left:auto}
        .reference{display:flex;flex-direction:column;gap:2px;min-width:0}.reference strong{overflow-wrap:anywhere}
        .reference-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--secondary-text-color,#666)}
        .status{font-size:12px;font-weight:600;border-radius:20px;padding:4px 11px;background:var(--secondary-background-color,#eef2fa);color:var(--primary-text-color,#284795);text-align:center}
        .route{display:grid;grid-template-columns:minmax(0,1fr) 24px minmax(0,1fr);align-items:center;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--divider-color,#ddd)}
        .hub:last-child{text-align:right}.hub-label{font-size:12px;color:var(--secondary-text-color,#666);margin-bottom:2px}.hub-code{font-size:20px;font-weight:600;overflow-wrap:anywhere}
        .arrow{text-align:center;font-size:20px;color:var(--secondary-text-color,#666)}
        .location{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px;margin-bottom:8px}.location-label{color:var(--secondary-text-color,#666)}
        .dates{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:5px 14px;margin:0;font-size:13px}.dates dt{color:var(--secondary-text-color,#666)}.dates dd{margin:0;overflow-wrap:anywhere}
        .remove{background:transparent;color:var(--error-color,#db6262);border:1px solid var(--divider-color,#555);font-size:12px;padding:6px 10px}
        .event-message{color:var(--secondary-text-color,#666);white-space:pre-line;font-size:13px;margin-bottom:8px;overflow-wrap:anywhere}
        .message{margin:8px 0;font-size:13px;line-height:1.5}.message:empty{display:none}
        @media(max-width:360px){.body{padding:16px}.search{gap:6px}button{padding:8px 14px}}
      </style>
      <ha-card><div class="body">
      <div class="card-heading"><img alt="The Courier Guy">
      <h3>Track your parcel</h3></div>
      <form><label class="kind" hidden>Reference type<select name="kind"><option value="waybill">Shipment waybill</option>
      <option value="tracking_reference">Parcel barcode</option></select></label>
      <div class="search"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>
      <input aria-label="Waybill or parcel barcode" name="reference" required maxlength="150" autocomplete="off" placeholder="e.g. ABCDE123">
      <button type="submit">Track</button></div></form>
      <div class="message" role="status" aria-live="polite"></div><div class="shipments"></div></div></ha-card>`;
    this.shadowRoot.querySelector(".kind").hidden = !config.show_reference_type;
    this.shadowRoot.querySelector("select").value = config.reference_type === "tracking_reference" ? "tracking_reference" : "waybill";
    this.shadowRoot.querySelector("img").src = config.logo || "/pudo_static/tcg-logo.svg";
    this.shadowRoot.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      this._track();
    });
    this._renderShipments();
  }

  set hass(hass) { this._hass = hass; this._renderShipments(); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  static getStubConfig() { return {}; }

  _formatStatus(value) {
    return String(value || "unknown").replaceAll("-", " ").replaceAll("_", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  _formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    // Never guess the timezone of a naive API timestamp.
    if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) return String(value).replace("T", " ");
    try {
      return new Intl.DateTimeFormat(this._hass?.locale?.language || "en-ZA", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        hour12: false, timeZone: this._hass?.config?.time_zone || "Africa/Johannesburg",
      }).format(date);
    } catch (_) { return String(value); }
  }

  async _track() {
    if (this.preview) return;
    if (this._busy || !this._hass) return;
    const root = this.shadowRoot;
    const reference = root.querySelector("input").value.trim();
    const kind = root.querySelector("select").value;
    const message = root.querySelector(".message");
    if (!reference) { message.textContent = "Enter a tracking reference."; return; }
    if (!this._hass.user?.is_admin) {
      message.textContent = "An administrator must add new tracked parcels. Existing parcels are shown below.";
      return;
    }
    this._busy = true;
    root.querySelector("button").disabled = true;
    message.textContent = "Checking shipment…";
    let flowId;
    try {
      const flow = await this._hass.callApi("POST", "config/config_entries/flow", {
        handler: "pudo", show_advanced_options: false,
      });
      flowId = flow.flow_id;
      if (flow.type !== "form" || flow.step_id !== "user") throw new Error("Unexpected setup response");
      const result = await this._hass.callApi("POST", `config/config_entries/flow/${flowId}`, {
        reference, reference_type: kind,
      });
      if (result.type === "create_entry") {
        flowId = undefined;
        message.textContent = "Parcel added. Tracking updates every five minutes.";
        root.querySelector("input").value = "";
      } else if (result.type === "abort") {
        flowId = undefined;
        message.textContent = result.reason === "already_configured" ? "This parcel is already tracked." : "Unable to add this parcel.";
      } else {
        const error = result.errors?.base || result.errors?.reference;
        message.textContent = error === "not_found" ? "No shipment found. Check the reference and reference type." :
          error === "invalid_reference" ? "Enter a tracking reference." : "Tracking service unavailable. Please try again.";
      }
    } catch (error) {
      message.textContent = "Unable to add parcel. Check that the PUDO integration is installed and you are signed in as an administrator.";
    } finally {
      if (flowId) {
        try { await this._hass.callApi("DELETE", `config/config_entries/flow/${flowId}`); } catch (_) { /* Already expired. */ }
      }
      this._busy = false;
      root.querySelector("button").disabled = false;
    }
  }

  async _remove(shipment, button) {
    if (this.preview) return;
    if (!this._hass.user?.is_admin || button.disabled) return;
    const reference = shipment.attributes.pudo_reference;
    if (!window.confirm(`Remove ${reference} from Home Assistant? This deletes its tracking sensors. It does not cancel the shipment.`)) return;
    const message = this.shadowRoot.querySelector(".message");
    button.disabled = true;
    try {
      const entity = await this._hass.callWS({ type: "config/entity_registry/get", entity_id: shipment.entity_id });
      const entries = await this._hass.callApi("GET", "config/config_entries/entry?domain=pudo");
      const entry = entries.find(e => e.entry_id === entity.config_entry_id && e.domain === "pudo");
      if (!entry) throw new Error("Tracking entry not found");
      const result = await this._hass.callApi("DELETE", `config/config_entries/entry/${encodeURIComponent(entry.entry_id)}`);
      message.textContent = result?.require_restart ? "Parcel removed. Restart Home Assistant to finish unloading its sensors." : "Parcel removed from tracking.";
    } catch (error) {
      message.textContent = "Unable to remove parcel. Please try again or remove its entry in Settings → Devices & services.";
    } finally {
      button.disabled = false;
    }
  }

  _renderShipments() {
    if (!this._hass || !this.shadowRoot) return;
    const container = this.shadowRoot.querySelector(".shipments");
    const states = Object.values(this._hass.states);
    const shipments = states.filter(s => s.attributes.pudo_role === "status");
    const signature = JSON.stringify([this._hass.user?.is_admin, this._hass.locale, this._hass.config?.time_zone, states.filter(s => s.attributes.pudo_role)]);
    if (signature === this._signature && container.childNodes.length) return;
    this._signature = signature;
    container.replaceChildren();
    for (const shipment of shipments) {
      const attrs = shipment.attributes;
      const event = states.find(s => s.attributes.pudo_role === "latest_event" && s.attributes.pudo_reference === attrs.pudo_reference);
      const row = document.createElement("div"); row.className = "shipment";
      const text = (tag, value, className) => {
        const node = document.createElement(tag);
        node.textContent = value;
        if (className) node.className = className;
        return node;
      };
      const reference = document.createElement("div"); reference.className = "reference";
      reference.append(text("span", "Tracking reference", "reference-label"), text("strong", attrs.pudo_reference));
      const header = document.createElement("div"); header.className = "shipment-header";
      const actions = document.createElement("div"); actions.className = "shipment-actions";
      actions.append(text("span", this._formatStatus(shipment.state), "status"));
      header.append(reference, actions);
      const route = document.createElement("div"); route.className = "route";
      for (const [label, code] of [["Collection Hub", attrs.collection_hub], ["Delivery Hub", attrs.delivery_hub]]) {
        if (route.childNodes.length) route.append(text("span", "→", "arrow"));
        const hub = document.createElement("div"); hub.className = "hub";
        hub.append(text("div", label, "hub-label"), text("div", code || "—", "hub-code"));
        route.append(hub);
      }
      const location = document.createElement("div"); location.className = "location";
      location.append(text("span", "Current location:", "location-label"), text("strong", event?.attributes.location || "—"));
      const dates = document.createElement("dl"); dates.className = "dates";
      for (const [label, value] of [["Latest update", event?.attributes.date], ["Collected", attrs.shipment_collected_date], ["Delivered", attrs.shipment_delivered_date]]) {
        if (value) dates.append(text("dt", label), text("dd", this._formatDate(value)));
      }
      row.append(header, route, location);
      if (event?.attributes.message) row.append(text("div", event.attributes.message, "event-message"));
      row.append(dates);
      if (this._hass.user?.is_admin) {
        const remove = document.createElement("button"); remove.type = "button";
        remove.className = "remove"; remove.textContent = "Remove";
        remove.setAttribute("aria-label", `Remove ${attrs.pudo_reference} from tracking`);
        remove.addEventListener("click", () => this._remove(shipment, remove));
        actions.append(remove);
      }
      container.append(row);
    }
  }
}
const existingPudoCard = customElements.get("pudo-tracking-card");
if (!existingPudoCard) {
  customElements.define("pudo-tracking-card", PudoTrackingCard);
} else {
  // An old /local resource may still be configured. Upgrade its methods so it
  // cannot shadow the integration-managed card when it loads first.
  for (const name of Object.getOwnPropertyNames(PudoTrackingCard.prototype)) {
    if (name !== "constructor") Object.defineProperty(existingPudoCard.prototype, name,
      Object.getOwnPropertyDescriptor(PudoTrackingCard.prototype, name));
  }
}
window.customCards = window.customCards || [];
window.customCards = window.customCards.filter(card => card.type !== "pudo-tracking-card");
window.customCards.push({
  type: "pudo-tracking-card", name: "The Courier Guy / PUDO",
  description: "Enter a waybill and track your parcels.", preview: true,
  documentationURL: "https://github.com/gert-bezuidenhout/ha.courier-guy",
});
