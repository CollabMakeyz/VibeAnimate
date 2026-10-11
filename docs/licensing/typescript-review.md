# TypeScript 5.9.3 bundled-notice review

2026-10-11. Status: **approved by the user for the exact scope below**.

The npm package declares Apache-2.0. Its bundled ThirdPartyNoticeText.txt also
identifies DefinitelyTyped (MIT), Unicode data/software, DOM material under W3C
Software and Document terms and WHATWG CC-BY-4.0, W3C Community Final Specification
Agreement terms, and Khronos WebGL material (MIT). The exact upstream notice is
preserved alongside this review; no broad license exception is inferred from the
package's top-level Apache identifier.

Approved scope: development-only TypeScript 5.9.3 compiler and standard declaration
libraries, retaining the upstream license and notices. The compiler is not shipped
in the editor. This approval would apply only to this exact reviewed package and
its bundled notice, not to other dependencies or later TypeScript versions.

The initial metadata-only check missed these bundled terms. A diagnostic type check
ran before the omission was found. Compiler use was paused until the explicit
approval required by MASTER PLAN.md, Dependency Policy:
“Qualquer outra licença exige decisão explícita e aprovação antes de uso.”

The user answered “Aprovar essa exceção restrita” to the question naming TypeScript
5.9.3, Unicode, W3C and CC-BY-4.0, development-only use, retained notices, and no
compiler distribution in the app. Approval was received in the originating Codex
chat on 2026-10-11. The pinned inventory records the package integrity, notice hash
and this evidence. Upgrades require a fresh review; this is not a global whitelist.
No completed Foundation milestone is claimed.
