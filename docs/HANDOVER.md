# Karting Studio: maintainer handover

[One-screen summary](START-HERE.md) · [User manual](USER-MANUAL.md) · [Feature overview](../README.md) · [Recorded validation](../VALIDATION.md)

## Purpose and behaviour to preserve

Review recorded karting sessions, compare drivers and distinguish a fast lap from consistent pace. The hosted tool combines session analysis, driver profiles and owner-managed imports. Public comparison links, when enabled by the owner, are read-only views of current saved results.

- **Session selection:** Choose venue/session and inspect a leaderboard and lap history. (Hosted analysis.)
- **Driver comparison:** Compare two drivers, lap charts, median pace, consistency and available summary metrics. (Hosted analysis.)
- **Incident handling:** Exclude an incident lap with a reason and restore it later; retain the original record. (Hosted analysis.)
- **Driver directory:** Track repeated drivers, aliases and profile decisions; owner tools merge/unmerge identities. (Hosted analysis.)
- **Ratings:** Choose the disclosed Peak speed or Balanced driving comparison convention. (Hosted analysis.)
- **Imports and sharing:** Preview workbook imports and share supported read-only driver comparisons. (Hosted analysis.)

The [demo](../demo.html) is a smaller, labelled simulation with fictional data. It explains cause and effect without the real service; it is not evidence of a working production installation. Numbered screenshots in the user manual distinguish actual-app captures from demo captures.

## Files and sources of truth

| Actual package path | Maintainer role |
| --- | --- |
| [projects-host/site/yas-karting](../projects-host/site/yas-karting) | Browser timing/analytics UI |
| [projects-host/host/karting_portal.py](../projects-host/host/karting_portal.py) | Stored records, profiles and sharing |
| [projects-host/host/karting.py](../projects-host/host/karting.py) | Timing integration module |
| [demo-source](../demo-source) | Editable demo HTML/CSS/runtime and embedded screenshot tour |
| [SOURCE-MANIFEST.json](../SOURCE-MANIFEST.json) | Original copied-source paths and SHA-256 checkpoint values |

The original working source is under C:/Users/lamon/Desktop/AI TOOLS/NAS for NAS modules; adjacent CAD/watch source locations are recorded by the full backup’s reviewed source manifest. This package contains only the explicitly copied source, not an automatic mirror. The main private nas-projects backup retains the broader shared host context.

## Setup, run and tests

Run commands from this repository root unless a `cd` is shown. Use a disposable checkout and fictional data for first setup. Dependencies, SDKs, signing material and personal data are not bundled. The following are continuation instructions grounded in the retained source, **not commands executed or newly certified by this handover**.

Run through the configured authenticated Projects gateway. Use demo.html for a fictional local session.

Selected project check:

No independent automated production test suite is included for this module/single-file package. Use the project-specific checks below and the shared host test suite where applicable; do not invent an `npm test` command.

For the documentation demo alone, serve this repository on loopback with `python -m http.server 8765 --bind 127.0.0.1` and open `/demo.html`. Choose a free port if another preview is running. JavaScript syntax can be checked with `node --check demo-source/runtime.js`. `python demo-source/rebuild.py` rewrites demo.html, so run it only in a disposable checkout or an authorised demo-editing session. A local server cannot provide missing HA/CAD/NAS functions. Inspect browser tests for installed dependencies, fixture requirements and network targets before running them with the approved browser tooling.

## Data, configuration and backup boundaries

The portal stores karting-portal.json under its configured data directory. Timing imports, original archives, identity links, notes and exclusions are runtime data and excluded. Keep public comparison payloads distinct from private notes/admin records.

The NAS stores imported timing records, identity decisions, notes and exclusions. Source archives are separate from Git source. Public links expose their permitted comparison, so choose sharing deliberately.

Git preserves reviewed source and documentation. It does not copy browser storage, application databases, uploaded models/photos, accepted device settings, SDKs or credentials. Maintain independent recovery copies of the data identified above, including matching configuration and asset versions. Never add real secrets to examples, issues or logs. Private source copies on GitHub are not proof of a complete NAS/offsite data backup.

## Current verification and Git state

Before these documentation edits on 14 October 2026, this package was clean on branch `main` at `d84ad605bc426a51896c7b83410efef34b0e2f35` and its private upload was verified. All 18 manifest-listed source entries matched their stored checksums before editing. The upload follow-up has completed all 17 repositories and is paused; it does not run this tool or back up its live data.

These handover pages and README links accompany the private source package. Preserve them when continuing; stage only reviewed changes. Recheck current `git status --short --branch` and `git diff` before starting. No project-specific background schedule was inspected or changed in this documentation pass. Any service schedules in older notes are historical claims to verify in the actual deployment.

Earlier package checks and limits are recorded in [VALIDATION.md](../VALIDATION.md). This handover adds documentation/link/whitespace/secret and source-preservation checks only. No current NAS release, real hardware state, fresh installation, complete data restoration or offsite-backup freshness was verified here.

## Recovery approach

1. Preserve the current installation/data before changing it. Identify the exact code commit and data snapshot required; do not assume this package matches the running service.
2. Recover source into a new folder. Verify the source manifest and restore the project-specific configuration/assets described above separately. Recreate dependencies from the retained project files and guides.
3. Restore user data into an isolated instance or clean test browser. Check a representative editable record, associated files and save/reload behaviour, then compare to the original. Do not test recovery by overwriting production.
4. Record what actually restored and what remains missing. A demo opening or a passing syntax check is not a production recovery drill. Real deployment/device actions need the existing authorised workflow.

## Known limits and next work

Stars are a disclosed relative scoring convention, not an independent assessment of driving ability. This repository contains app/host modules and needs the shared gateway to run as hosted software. The demo uses fictional drivers.

**Priority:** Recheck arbitrary-driver comparisons, reversible exclusions and merge conflict handling on fixtures in the shared host. Stars are a declared relative convention, not an independent skill measurement; never adjust raw timing to favour a person.

Common symptoms to check for this tool:

- Missing lap chart: the source may contain only a summary.
- Unexpected ranking: inspect excluded laps, lap-1 policy and the selected scoring convention.
- Duplicate name: verify identity and use the merge preview; do not merge solely because names resemble each other.

Keep [the release checklist](../RELEASE-CHECKLIST.md) and [third-party notes](../THIRD-PARTY.md) with the package. Original contributions use MIT; bundled/upstream code and assets keep their own licences. Public publication is a separate decision; preparing documentation is not permission to publish.
