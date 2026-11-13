const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let Card;
let confirmed = true;
vm.runInNewContext(readFileSync('www/pudo/pudo-tracking-card.js', 'utf8'), {
  HTMLElement: class {}, window: { confirm: () => confirmed },
  customElements: { get: () => false, define: (_, value) => { Card = value; } },
});
async function run(result, admin = true) {
  const card = new Card();
  assert.equal(card._formatStatus('delivered'), 'Delivered');
  assert.equal(card._formatStatus('out-for-delivery'), 'Out For Delivery');
  assert.equal(card._formatStatus('deposit_pending'), 'Deposit Pending');
  card._hass = { locale: { language: 'en-GB' }, config: { time_zone: 'Africa/Johannesburg' } };
  assert.match(card._formatDate('2026-08-04T12:49:57.16Z'), /4 Aug 2026/);
  assert.match(card._formatDate('2026-08-04T12:49:57.16Z'), /14:49/);
  assert.equal(card._formatDate('invalid'), 'invalid');
  assert.equal(card._formatDate(null), '');
  const nodes = { input: { value: ' ABC ' }, select: { value: 'waybill' }, '.message': {}, button: {} };
  card.shadowRoot = { querySelector: key => nodes[key] };
  const calls = [];
  card._hass = { user: { is_admin: admin }, callApi: async (...args) => {
    calls.push(args);
    if (args[0] === 'DELETE') return;
    if (calls.length === 1) return { type: 'form', step_id: 'user', flow_id: 'test' };
    return result;
  }};
  await card._track();
  return { nodes, calls };
}
(async () => {
  let r = await run({ type: 'create_entry' });
  assert.equal(r.calls[1][2].reference, 'ABC');
  assert.equal(r.nodes.input.value, '');
  assert.equal(r.nodes.button.disabled, false);
  assert.equal(r.calls.length, 2);
  r = await run({ type: 'form', errors: { base: 'not_found' } });
  assert.match(r.nodes['.message'].textContent, /No shipment found/);
  assert.equal(r.calls[2][0], 'DELETE');
  r = await run({ type: 'abort', reason: 'already_configured' });
  assert.match(r.nodes['.message'].textContent, /already tracked/);
  r = await run({}, false);
  assert.equal(r.calls.length, 0);
  assert.match(r.nodes['.message'].textContent, /administrator/);
  const card = new Card();
  const message = {};
  const button = { disabled: false };
  const calls = [];
  card.shadowRoot = { querySelector: () => message };
  card._hass = { user: { is_admin: true },
    callWS: async req => { assert.equal(req.entity_id, 'sensor.parcel_status'); return { config_entry_id: 'entry1' }; },
    callApi: async (method, path) => {
      calls.push([method, path]);
      return method === 'GET' ? [{ entry_id: 'entry1', domain: 'pudo' }] : { require_restart: false };
    } };
  const shipment = { entity_id: 'sensor.parcel_status', attributes: { pudo_reference: 'ABC' } };
  confirmed = false;
  await card._remove(shipment, button);
  assert.equal(calls.length, 0);
  confirmed = true;
  await card._remove(shipment, button);
  assert.deepEqual(calls[1], ['DELETE', 'config/config_entries/entry/entry1']);
  assert.match(message.textContent, /removed from tracking/);
  assert.equal(button.disabled, false);
  calls.length = 0;
  card._hass.user.is_admin = false;
  await card._remove(shipment, button);
  assert.equal(calls.length, 0);
  card._hass.user.is_admin = true;
  card._hass.callApi = async () => { throw new Error('offline'); };
  await card._remove(shipment, button);
  assert.match(message.textContent, /Unable to remove/);
  assert.equal(button.disabled, false);
  console.log('Card tests passed: add, not found, cleanup, duplicate, non-admin.');
})().catch(error => { console.error(error); process.exitCode = 1; });
