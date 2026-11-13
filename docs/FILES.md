# Repository files

| Path | Purpose |
| --- | --- |
| `custom_components/pudo/` | Integration installed by HACS. |
| `manifest.json` in the integration | Domain, version, ownership and support links. |
| `api.py`, `coordinator.py` | HTTP client, parsing and polling. |
| `config_flow.py` | Home Assistant setup forms. |
| `sensor.py` | Sensor states and attributes. |
| `brand/` | Supplied integration logo and icon. |
| `strings.json`, `translations/en.json` | Configuration text. |
| `www/` | Optional dashboard files; install separately. |
| `tests/` | Offline regression checks with no live API requests. |
| `hacs.json` | Custom repository metadata. |
| `MIGRATION.md` | Upgrade instructions. |
| `.github/workflows/` | Validation and automatic publication. |
| `docs/releases/` | Notes for each published version. |
| `docs/HACS_SUBMISSION.md` | Deferred catalogue checklist. |
| `LICENSE` | MIT licence for original code. |

## Publishing

Increment the manifest version and add `docs/releases/<version>.md`. Merge only after checks pass. A push to main that changes the manifest triggers validation again, then publishes a complete installation ZIP. Tags are `MAJOR.MINOR.PATCH` without a v prefix. Only the publish job has contents-write access. Existing releases are not overwritten.

HACS installs the integration folder only. It does not copy the optional dashboard files into Home Assistant's www folder.
