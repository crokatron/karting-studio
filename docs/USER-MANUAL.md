# Karting Studio — visual user manual

[Project overview](../README.md) · [Offline interactive demo](../demo.html)

Start with the numbered picture guide. Each number identifies the exact highlighted control. Work through one step at a time; the longer reference is below it.

### Try the working offline example

Screenshot of this project’s interactive demo. Side-by-side services are explicitly simulated.

![Karting Studio — numbered controls](images/guide-1.jpg)

1. **Identify an incident.** This fictional 78.3-second lap remains in the original records.
2. **Recalculate fairly.** Compare with and without the reversible exclusion.
3. **Separate best from consistency.** Best and mean laps tell different stories; neither is a universal rating.

## Detailed task reference

### Compare two drivers

1. Choose the venue and session first so both drivers are being compared in the intended context. Select two driver profiles.
2. Read the best lap alongside median pace and consistency; a single best lap does not describe an entire session.
3. Inspect the lap plot and lap-1 choice. A summary-only source may not support a full lap-by-lap chart.

### Explain an outlier

1. Open Inspect laps and find the specific incident lap. An owner can enter a reason and exclude it from the relevant analysis.
2. Check how the summary changes. Exclusion is a reversible analysis decision, not deletion of the original timing record.
3. Use Restore lap to put it back; retain notes explaining why the comparison changed.

### Maintain driver identities and share results

1. In the directory, verify that similar names are actually the same person before merging. Select the intended profiles and review the proposed combined history.
2. Give the combined profile a clear name and save only after checking the preview. Retained original timing names can resolve through aliases; unmerge is a separate owner operation.
3. Use Share / Copy link for a comparison you intend others to see. The link reflects current saved data, not a frozen report, and its permitted view remains read-only.

### Import another session

1. Use Imports & sources to select the supported workbook/archive. Review its preview and duplicate status before committing.
2. Confirm venue, participants, sessions and lap counts rather than assuming a new file is entirely new data.
3. Return to the relevant session and verify the visible results. Source spreadsheets should remain backed up separately.

## Keep your work

The NAS stores imported timing records, identity decisions, notes and exclusions. Source archives are separate from Git source. Public links expose their permitted comparison, so choose sharing deliberately.

## If something looks wrong

- Missing lap chart: the source may contain only a summary.
- Unexpected ranking: inspect excluded laps, lap-1 policy and the selected scoring convention.
- Duplicate name: verify identity and use the merge preview; do not merge solely because names resemble each other.

## What this manual does not promise

Stars are a disclosed relative scoring convention, not an independent assessment of driving ability. This repository contains app/host modules and needs the shared gateway to run as hosted software. The demo uses fictional drivers.

Screenshots show the actual application where captured. The offline demo is a deliberately smaller simulation and identifies its dummy services. It never controls devices, sends notifications, uploads files or launches printing.
