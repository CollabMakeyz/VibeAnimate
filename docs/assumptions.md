# Decisions and assumptions

Decisions dated 2026-10-10. None of these entries is evidence of implemented parity.

1. **Continuation baseline:** the supplied GitHub repository at `a673883` contains
   only README.md. Start at Phase Zero, preserving that history.
2. **Product name:** the user explicitly named the project VibeAnimate. Substitute
   that name for the generic `[PRODUCT NAME]` token. Historical trademarks appear
   only in research and compatibility documents; use original branding/artwork.
3. **Milestone numbering:** M1–M11 follow the eleven named milestones in the plan.
   The isolated reference to scripting as “M7” does not override their order;
   scripting belongs to M9 Text + Scripting + Publish.
4. **Working branch:** `codex/vibeanimate-foundation`; commits remain reviewable.
   No force push or replacement of remote history.
5. **Research vs implementation:** present-day documentation is class A for its
   own version, not proof of 2008 behavior. Historical claims require historical
   evidence or an explicit PROVISIONAL/UNKNOWN marker.
6. **Coordinate conventions (proposed):** Stage origin top left; x right, y down;
   stored coordinates float64; GPU float32; internal frame indices zero based,
   displayed frame labels one based. Confirm in Phase One contracts.
7. **Format name (proposed):** `.vibeanim`, an original versioned package. File
   extension availability is not a trademark or format-compatibility claim.
8. **Dependencies:** research tools on the host are not runtime dependencies. Do
   not redistribute downloaded manuals, proprietary resources, or their code.
   Dependency adoption requires recorded version and license evidence first.
9. **Native build environment:** Node 24.19.0 and npm 12.0.2 are available;
   Rust/Cargo were not found on PATH or in the standard user cargo directory.
   This is an environment finding, not a reason to waive desktop build checks.
10. **Hardware:** no physical tablet has been exercised. Synthetic tests will not
    be reported as Wacom/Huion/XP-Pen/Surface certification.
11. **Source citations in the supplied plan:** opaque citation tokens have no
    resolvable bibliography. Research documents use independently retrieved URLs
    and page/section locators instead of presenting those tokens as evidence.
12. **Phase One conventions confirmed (2026-10-11):** logical Stage pixels, float64
    storage, x right/y down, zero-based half-open frame ranges, rational FPS,
    explicit angle units and sRGB saved colors. See docs/architecture.md.
13. **Native v1 authority:** document.json contains authoritative library metadata
    and symbol definitions; optional library entries cannot override it. Select
    bounded ZIP32 stored/DEFLATE, with no library adopted by this design choice.
14. **Compiler exception:** the user explicitly approved TypeScript 5.9.3 and its
    bundled Unicode/W3C/CC-BY terms for development only on 2026-10-11. Exact evidence
    and notice hashes are recorded in docs/licensing; upgrades are not preapproved.
15. **Phase One completion:** interfaces are architecture deliverables, not runtime
    stubs or claims of implemented tools. All model, command, renderer, worker,
    file-container and native-shell behavior still needs milestone implementation.

16. **M1 native implementation (2026-10-11):** Preact 11.0.1 is confined to chrome;
    TypeScript native ESM plus an import map is sufficient without a bundler. The
    optional server-rendering peer is excluded. Cargo owns the native workspace;
    the root npm lock owns frontend packages. No installer is claimed by M1.
17. **Exact additional approvals:** the user approved the 31 Rust versions in
    tauri-exceptions-proposal.md and, separately, @tauri-apps/api 2.12.3 with 0BSD
    helper code and CC0 metadata. These are separate from the TypeScript approval.
18. **M1 demo and E2E:** the native diagnostics window is the foundation demo;
    the rectangle DTO remains a contract example. Windows WebView2 gets a real
    owned-process E2E harness; macOS/Linux E2E is explicitly pending. API flags
    do not establish physical device support.
19. **Formatting:** use the already reviewed TypeScript compiler syntax printer
    for desktop TS formatting, strict compiler/AST checks for frontend lint, and
    Rustfmt/Clippy for Rust. Do not add a second parser dependency merely for style.

20. **Windows CI testing (2026-10-12):** Runtime 150+ does not honor WebView
    environment overrides in elevated processes. Configure CDP through the native
    API only in the explicit debug e2e feature, with a fresh empty profile and a
    validated loopback port. Normal/release startup excludes the test configuration;
    do not downgrade the runtime or change system policy to make the test pass.
