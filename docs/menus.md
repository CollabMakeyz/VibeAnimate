# Historical menu inventory

Status: **PARTIAL**. Entries below were located in the official CS4 user manual;
PDF pages are one based. This is a behavioral command inventory, not a verified
exhaustive export of every menu, separator, dynamic item or platform variant.
All production commands are **NOT IMPLEMENTED**. Do not expose inert menu items.

The manual contains shared Creative Suite instructions. Commands specifically
attributed to Photoshop, Illustrator, InDesign etc. are excluded. In particular,
Flash workspace save/manage uses the Application bar switcher (PDF 21), not the
other products' Window > Workspace examples. Menus inside Test Movie/debugger or
script windows are separate contexts and must not be put into the main menu blindly.

| Menu/context | Located entries | PDF pages | Applicable behavior / limits |
|---|---|---|---|
| File / document | New; Open; Save; Save As; Save As Template; Save And Compact; File Info; Exit (Windows) | 35,49–52 | Native application will use original format; macOS Quit in application menu |
| File / import | Import to Stage; Import to Library; Open External Library; Import Video | 68–69,162,294 | Each enabled adapter needs a supported-subset report |
| File / export | Export Movie; Export Image | 416 | New export formats implement plan, not proprietary codecs |
| File / publishing | Publish; Publish Settings; Publish Preview with format submenu | 56–57,377–403 | No Flash Player runtime dependency |
| File / printing | Page Setup (Windows); Print Margins (Macintosh); Print | 55 | Exact print workflow remains research scope |
| File / external services | Share My Screen; Update for Dreamweaver; AIR Settings | 21–22,53,405 | Historical inventory only; no copied discontinued service behavior |
| Edit / history | Undo; Redo; Repeat | 34–38 | Repeatable actions distinct from reversible commands |
| Edit / clipboard and selection | Cut; Copy; Paste; Paste In Place; Paste In Center; Clear; Duplicate; Select All; Deselect All | 111,124,130,243 | Context-sensitive; fields own native clipboard/edit actions |
| Edit / nested editing | Edit Selected; Edit All; Edit Symbols; Edit In Place | 127,154–157 | Breadcrumb/definition versus instance context |
| Edit / Timeline | Copy Frames; Paste Frames; Select All Frames; Remove Frame; Clear Keyframe; Copy Motion As ActionScript 3.0; Paste Motion | 178,206–207,220 | Original script API; no false AS3 conversion |
| Edit / preferences | Preferences; Keyboard Shortcuts; Customize Tools Panel; Font Mapping | 22,26,45–47,259 | In application menu on macOS where specified |
| Edit / search | Find and Replace | 64–66 | Text and document-search contexts differ |
| View / navigation | Zoom In; Zoom Out; Magnification > Fit in Window / Show All / Show Frame; Pasteboard; Go To | 23,185 | Current scene/symbol context |
| View / rulers and guides | Rulers; Guides > Show Guides / Lock Guides / Clear Guides / Edit Guides | 24 | Guides belong to editing context |
| View / grid | Grid > Show Grid / Edit Grid | 25 | Stage assistance, not persistent rendered artwork |
| View / snapping | Snapping > Snap to Grid / Snap to Guides / Snap to Objects / Snap to Pixels / Snap Align / Edit Snapping | 24–25,128–129 | Independent toggles and tolerances |
| View / overlays and quality | Hide Edges; Show Shape Hints; Show Tab Order; Preview Mode | 125,224,315,442 | Preview quality and accessibility overlay are separate |
| View / script window | Line Numbers; Word Wrap | 346 | Script context only |
| View / Test Movie | Download Settings; Bandwidth Profiler; Simulate Download; Streaming Graph; Frame by Frame Graph | 449–450 | Historical SWF test-player diagnostics; not ordinary Stage menu |
| Insert / Timeline | Frame; Keyframe; Blank Keyframe; Layer; Layer Folder | 177,179,225 | Frame command meaning depends on layer/span kind |
| Insert / animation | Motion Tween; Classic Tween; Shape Tween | 198–199,217,223 | Validate eligible target and existing span |
| Insert / definitions | New Symbol; Scene | 154,184 | Stable ID creation with undo |
| Insert / screen-document | Nested Screen | 324 | Historical screen-document type, not general vector timeline |
| Modify / document and ownership | Document; Group; Ungroup; Break Apart; Convert To Symbol; Symbol > Duplicate Symbol | 24,126–127,154–155 | Group ≠ union; Break Apart can alter merge topology |
| Modify / Combine Objects | Union; Intersect; Punch; Crop | 123 | Detailed edge-case corpus still required |
| Modify / Shape | Smooth; Straighten; Optimize; Convert Lines To Fills; Expand Fill; Soften Fill Edges; Add Shape Hint; Remove All Hints | 117–118,224–225 | Actual geometry operations |
| Modify / Transform | Scale; Rotate and Skew; Rotate and Scale; Rotate 90° CW / CCW; Flip Vertical / Horizontal; Remove Transform; Distort; Envelope | 118–122 | Distortion/envelope eligibility narrower than affine transforms |
| Modify / Arrange | Bring To Front; Send To Back; Bring Forward; Send Backward; Lock; Unlock All | 124,126 | Editable stacking and protected selections |
| Modify / Timeline | Layer Properties; Distribute To Layers; Synchronize Symbols; Clear Keyframe (conflicting location in manual) | 29,191,216,218 | Clear Keyframe location needs menu-export corroboration |
| Modify / Bitmap | Trace Bitmap | 95 | Historical inventory; actual tracing not inferred from bitmap import |
| Text | Check Spelling; Spelling Setup; Style > Faux Bold / Faux Italic | 255,260 | Full typography menu/submenus still need verified inventory |
| Commands | Run Command; Manage Saved Commands; Get More Commands; Convert Symbol to Flex Component | 37–38,370 | New editor scripts are independent; proprietary services/components not copied |
| Control / authoring | Play; Test Scene; Test Movie; Enable Simple Buttons; Enable Live Preview | 153,170–171,225 | Authoring playback versus runtime behavior |
| Control / player | Play; Rewind; Loop Playback; Disable Keyboard Shortcuts | 356,386 | Separate player focus context |
| Debug | Debug Movie; Begin Remote Debug Session > ActionScript version; List Variables; List Objects | 357–369 | Script version/player-dependent; original scripting diagnostics need own design |
| Window / primary panels | Tools; Properties; Library; Timeline; Actions; Color; Swatches; Output; Movie Explorer; Component Inspector; Behaviors | 26–34,132–138,175,333,364 | Shared command registry with visible/checked state |
| Window / Other Panels | History; Scene; Project; Web Services; Accessibility; Strings | 34–35,57,184,268–275,310 | Some historical workflows outside initial runtime scope |
| Window / library and windows | Common Libraries; Duplicate Window | 49,165 | External library resources cannot be copied |
| Window / Extensions | Kuler | 142 | Historical service only; original color tooling required |
| Help | Product Help; Adobe Product Improvement Program | 6–7 | Historical labels only; own local help/voluntary diagnostics |

## Outstanding completeness checks

Obtain a dated primary full menu/shortcut export or review all relevant remaining
manual sections and record coverage limits explicitly. Verify Text submenus,
Window Align/Transform/Info/Motion Editor entries, Help variants, Debug toolbar vs
menu distinctions, recent files/dynamic scenes and OS-specific placement. Resolve
Clear Keyframe's conflicting Edit/Modify references using primary version evidence.
Until then, the full-menu Phase Zero exit criterion stays unchecked.

## Dated inventory supplement

The publisher's public contents for Chris Grover's November 2008 *Flash CS4: The
Missing Manual*, appendix B, supplies a contemporaneous inventory:
[publisher record](https://www.oreilly.com/library/view/flash-cs4-the/9780596156770/pr04.html).
Confidence B; menu hierarchy still needs comparison against the primary manual.
No paywalled chapter content was accessed. Additional functional coverage:

| Menu | Gaps identified for reconciliation |
|---|---|
| File | Bridge browsing, recent files, close/all, check-in, save-all, revert, Windows send |
| Edit | Find-next, clear frames, motion copy and special paste |
| View | Quality levels from outline through full; document/scene navigation |
| Modify | Bitmap swap, envelope deletion, frame reversal/conversion, alignment, distribution and matching dimensions |
| Text | Family, size, style, alignment, letter spacing and scrollability |
| Commands | Motion XML copy, export and import |
| Control | Rewind/end, single-frame steps, ASO cleanup, scene looping, frame-action toggle and mute |
| Debug | Continue/stop, step into/over/out and breakpoint clearing |
| Window | Motion Editor/Presets, compiler errors, debugger panels, connection/workspace controls, panel hiding |
| Help | macOS search, extensions, support/training, activation/registration, update and About |

This identifies remaining commands rather than silently treating them as absent.
Historical external-service actions are inventoried, not promises to recreate
discontinued services. Implement original local equivalents only where the plan
requires functional scope; report compatibility deviations explicitly.
