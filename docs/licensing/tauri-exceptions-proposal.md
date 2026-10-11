# Tauri 2 dependency exception proposal

2026-10-11. Status: **APPROVED by the user**. Exact response: “Aprovar a proposta restrita”.
Approval applies only to the 31 versions and terms recorded below. The immutable
proposal JSON is preserved; adopted decisions are in `cargo-approvals.json`.

The plan allows MIT, Apache-2.0, BSD-2-Clause and BSD-3-Clause by default and says:
“Qualquer outra licença exige decisão explícita e aprovação antes de uso.”
This proposal is confined to the exact 31 dependency versions below, their recorded
crate checksums and retained notice hashes, for development and runtime use in
VibeAnimate with Tauri 2.12.3 / tauri-build 2.7.2. It is not an approval of future
versions, unrelated packages or arbitrary licenses. The prior TypeScript approval
does not apply to these packages.

Scope record: [exact proposal JSON](tauri-exceptions-proposal.json).
Proposal records digest (compact JSON SHA-256): `c21a83a57370f34c9844504a4fc25646deaa0dcad57a5bac729e709e8fa2e906`.

| Package | Version | Additional terms requiring approval | Retained evidence |
|---|---|---|---|
| crossbeam-channel | 0.5.17 | CC-BY-3.0 | [notice 1](cargo/a60eea817514531668d7e00765731449fe14d059d3249e0bc93b36de45f759f2.txt), [notice 2](cargo/5734ed989dfca1f625b40281ee9f4530f91b2411ec01cb748223e7eb87e201ab.txt), [notice 3](cargo/b16db96b93b1d7cf7bea533f572091ec6bca3234fbe0a83038be772ff391a44c.txt) |
| cssparser-macros | 0.7.1 | MPL-2.0 | [notice 1](cargo/fab3dd6bdab226f1c08630b1dd917e11fcb4ec5e1e020e2c16f83a0a13863e85.txt) |
| cssparser | 0.37.0 | MPL-2.0 | [notice 1](cargo/fab3dd6bdab226f1c08630b1dd917e11fcb4ec5e1e020e2c16f83a0a13863e85.txt) |
| dtoa-short | 0.3.5 | MPL-2.0 | [notice 1](cargo/1f256ecad192880510e84ad60474eab7589218784b9a50bc7ceee34c2b91f1d5.txt) |
| foldhash | 0.2.0 | Zlib | [notice 1](cargo/b1181a40b2a7b25cf66fd01481713bc1005df082c53ef73e851e55071b102744.txt) |
| icu_collections | 2.3.0 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| icu_locale_core | 2.3.0 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| icu_normalizer_data | 2.3.0 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| icu_normalizer | 2.3.0 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| icu_properties_data | 2.3.0 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| icu_properties | 2.3.0 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| icu_provider | 2.3.1 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| libloading | 0.7.4 | ISC | [notice 1](cargo/b29f8b01452350c20dd1af16ef83b598fea3053578ccc1c7a0ef40e57be2620f.txt) |
| litemap | 0.8.3 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| option-ext | 0.2.0 | MPL-2.0 | [notice 1](cargo/66a3107d5ad6a058aab753eaac2047ccb2ed0e39465dd0fe5844da3e300d5172.txt) |
| potential_utf | 0.1.6 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| regex-syntax | 0.8.11 | LicenseRef-Unicode-Data-Files-Software-1991-2018 | [notice 1](cargo/a60eea817514531668d7e00765731449fe14d059d3249e0bc93b36de45f759f2.txt), [notice 2](cargo/6485b8ed310d3f0340bf1ad1f47645069ce4069dcc6bb46c7d5c6faf41de1fdb.txt), [notice 3](cargo/74db5baf44a41b1000312c673544b3374e4198af5605c7f9080a402cec42cfa3.txt) |
| selectors | 0.38.0 | MPL-2.0 | [notice 1](cargo/fab3dd6bdab226f1c08630b1dd917e11fcb4ec5e1e020e2c16f83a0a13863e85.txt) |
| target-lexicon | 0.12.16 | Apache-2.0 WITH LLVM-exception | [notice 1](cargo/268872b9816f90fd8e85db5a28d33f8150ebb8dd016653fb39ef1f94f2686bc5.txt) |
| tinystr | 0.8.4 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| unicode-ident | 1.0.26 | Unicode-3.0 | [notice 1](cargo/62c7a1e35f56406896d7aa7ca52d0cc0d272ac022b5d2796e7d6905db8a3636a.txt), [notice 2](cargo/23f18e03dc49df91622fe2a76176497404e46ced8a715d9d2b67a7446571cca3.txt), [notice 3](cargo/f7db81051789b729fea528a63ec4c938fdcb93d9d61d97dc8cc2e9df6d47f2a1.txt) |
| utf8_iter | 1.0.4 | CC0-1.0 | [notice 1](cargo/c30152c94a6d75e021adbc52b3a52470366a46edb917e17deae3259251af244c.txt), [notice 2](cargo/cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30.txt), [notice 3](cargo/3fa4ca83dcc9237839b1bdeb2e6d16bdfb5ec0c5ce42b24694d8bbf0dcbef72c.txt) |
| writeable | 0.6.4 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| yoke-derive | 0.8.4 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| yoke | 0.8.3 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| zerofrom-derive | 0.1.8 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| zerofrom | 0.1.8 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| zerotrie | 0.2.5 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| zerovec-derive | 0.11.6 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| zerovec | 0.11.8 | Unicode-3.0 | [notice 1](cargo/f367c1b8e1aa262435251e442901da4607b4650e0e63a026f5044473ecfb90f2.txt) |
| zlib-rs | 0.6.8 | Zlib | [notice 1](cargo/e72111c52b7d96ebe25348dee19f0744f444d3c95ae6b1ecb6ccaecc5bce05ba.txt) |

## Handling commitments

Retain copyright, license and attribution notices in distributions. Keep these
upstream crates unmodified unless changes are reviewed and their obligations met.
For MPL files, preserve the covered source and provide recipients access to the
exact corresponding source; publish modifications to those files under MPL if made.
This is file-level coverage; it is not a plan to relicense VibeAnimate as a whole.
See [Mozilla’s MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) and the retained
license text for the actual conditions. Unicode/ISC/Zlib and LLVM-exception texts
remain attached to each exact package. CC-BY-3.0 appears in crossbeam-channel’s
bundled matching-test notice; CC0 appears in utf8_iter test notices. Both are retained
and included explicitly rather than inferred from their package-level MIT grants.

## Separate decisions already resolved or still bounded

Where an allowed OR branch exists, that branch is selected without requesting an
exception. The WebView2 loader binaries were compared against Microsoft SDK
1.0.3800.47: all nine match byte for byte. That SDK supplies BSD-3-Clause terms and
notices, retained in the candidate inventory; no proprietary-license exception is
being requested for those loaders. The installed WebView2 Runtime is a host component.

libdbus-sys’s vendored D-Bus code is excluded: the selected features are default and
pkg-config, and a feature change must fail audit. No GPL/AFL vendored build is
approved here. Apple SDK conditions mentioned by objc2 upstream remain a separate
platform build/distribution review; the crate grants are recorded as declared.

The complete 406-package graph and 223 deduplicated retained notice files are in
[the candidate inventory](../cargo-candidates.json). They remain candidates until
all adoption checks pass. This proposal grants no approval by itself.
