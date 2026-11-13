/* The Courier Guy / PUDO dashboard card. No external dependencies. */
class PudoTrackingCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}ha-card{display:block;border-radius:9px;overflow:hidden}
        .body{padding:40px 34px 24px;color:var(--primary-text-color,#151515)}
        .pin{display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:#e9ecf5;color:#2b4b98;margin:0 auto 18px}
        .pin svg{width:25px;height:25px}h3{text-align:center;font-size:19px;font-weight:700;margin:0 0 8px}
        .intro{text-align:center;font-size:13px;line-height:1.4;margin:0 auto 22px;max-width:350px;color:var(--secondary-text-color,#3f4b68)}
        img{display:block;width:120px;max-width:100%;margin:20px auto 0}
        form{display:grid;gap:12px}.kind{display:grid;gap:6px;font-size:13px}.kind[hidden]{display:none}
        .search{display:flex;align-items:center;gap:10px;border:1px solid var(--divider-color,#d2d7e3);border-radius:28px;padding:6px;box-shadow:0 1px 2px #0000000c}
        .search svg{width:19px;height:19px;flex:none;margin-left:10px;color:var(--secondary-text-color,#333)}
        input,select,button{font:inherit;box-sizing:border-box}
        input{flex:1;width:0;min-width:0;padding:7px 0;border:0;outline:none;background:transparent;color:inherit;font-size:14px}
        .search:focus-within{outline:2px solid #284795;outline-offset:2px}input::placeholder{color:var(--secondary-text-color,#8290ac)}
        select{padding:8px;border-radius:8px;background:var(--card-background-color,white);color:inherit;border:1px solid var(--divider-color,#ddd)}
        button{border:0;border-radius:22px;padding:7px 19px;background:#2b4b98;color:white;cursor:pointer;font-size:14px;font-weight:600}button:disabled{opacity:.55;cursor:wait}
        .shipment{border-top:1px solid var(--divider-color,#ddd);padding-top:14px;margin-top:14px}
        .shipment-header{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .remove{background:transparent;color:var(--error-color,#db6262);border:1px solid var(--divider-color,#555);font-size:12px;padding:6px 10px}
        .details{color:var(--secondary-text-color,#666);white-space:pre-line;margin-top:6px}
        .message{margin:12px 0;font-size:13px;line-height:1.5}.message:empty{display:none}
        @media(max-width:360px){.body{padding:28px 18px 20px}.search{gap:6px}button{padding:8px 14px}}
      </style>
      <ha-card><div class="body">
      <div class="pin" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg></div>
      <h3>Track your parcel</h3><p class="intro">Enter your tracking reference to see the latest status of your shipment.</p>
      <form><label class="kind" hidden>Reference type<select name="kind"><option value="waybill">Shipment waybill</option>
      <option value="tracking_reference">Parcel barcode</option></select></label>
      <div class="search"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>
      <input aria-label="Waybill or parcel barcode" name="reference" required maxlength="150" autocomplete="off" placeholder="e.g. ABCDE123">
      <button type="submit">Track</button></div></form>
      <div class="message" role="status" aria-live="polite"></div><div class="shipments"></div><img alt="The Courier Guy"></div></ha-card>`;
    this.shadowRoot.querySelector(".kind").hidden = !config.show_reference_type;
    this.shadowRoot.querySelector("select").value = config.reference_type === "tracking_reference" ? "tracking_reference" : "waybill";
    this.shadowRoot.querySelector("img").src = config.logo || "/local/pudo/tcg-logo.svg";
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
      const title = document.createElement("strong");
      title.textContent = `${attrs.pudo_reference} · ${this._formatStatus(shipment.state)}`;
      const details = document.createElement("div"); details.className = "details";
      details.textContent = [attrs.collection_hub && attrs.delivery_hub ? `${attrs.collection_hub} → ${attrs.delivery_hub}` : "",
        event?.attributes.message, event?.attributes.location,
        event?.attributes.date ? `Latest update: ${this._formatDate(event.attributes.date)}` : "",
        attrs.shipment_collected_date ? `Collected: ${this._formatDate(attrs.shipment_collected_date)}` : "",
        attrs.shipment_delivered_date ? `Delivered: ${this._formatDate(attrs.shipment_delivered_date)}` : "",
      ].filter(Boolean).join("\n");
      const header = document.createElement("div"); header.className = "shipment-header";
      header.append(title);
      if (this._hass.user?.is_admin) {
        const remove = document.createElement("button"); remove.type = "button";
        remove.className = "remove"; remove.textContent = "Remove";
        remove.setAttribute("aria-label", `Remove ${attrs.pudo_reference} from tracking`);
        remove.addEventListener("click", () => this._remove(shipment, remove));
        header.append(remove);
      }
      row.append(header, details); container.append(row);
    }
  }
}
if (!customElements.get("pudo-tracking-card")) customElements.define("pudo-tracking-card", PudoTrackingCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "pudo-tracking-card", name: "The Courier Guy / PUDO", description: "Enter a waybill and track your parcels." });
