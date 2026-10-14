# Karting Studio: start here

**Continuing this tool? Read [the detailed handover](HANDOVER.md).** For pictures and operation, use the [manual](USER-MANUAL.md) and [offline demo](../demo.html).

Imports timing data and compares laps while preserving originals, exclusions and driver identity decisions. Shared comparisons and owner editing have different access rules.

**Start with:** Compare two drivers. Choose the venue and session first so both drivers are being compared in the intended context. Select two driver profiles.

**Source:** this is a private source checkpoint, not a live-system mirror. Check [the source manifest](../SOURCE-MANIFEST.json) and current working files before merging.

**Keep your work safe:** The NAS stores imported timing records, identity decisions, notes and exclusions. Source archives are separate from Git source. Public links expose their permitted comparison, so choose sharing deliberately.

**Next maintainer action:** Recheck arbitrary-driver comparisons, reversible exclusions and merge conflict handling on fixtures in the shared host. Stars are a declared relative convention, not an independent skill measurement; never adjust raw timing to favour a person.

**Status:** private upload verified on 14 October 2026. These guides accompany the private source package. Live runtime, data backups and full recovery were not retested. Public release needs separate approval.
