# Certification Test Matrix - AburMD v1.0.0

| Test ID | Test Description | Expected Result | Verification Status |
| :--- | :--- | :--- | :--- |
| **TC-01** | Install & Launch | Application launches without error in default VIEW mode. | PASS |
| **TC-02** | Open `.md` document | Renders headings, paragraphs, lists, and tables correctly. | PASS |
| **TC-03** | Multi-Tab Navigation | `Ctrl+T` creates tab, `Ctrl+W` closes tab, `Ctrl+Tab` switches tab. | PASS |
| **TC-04** | VIEW ↔ EDIT Mode | Clicking `[ Edit ]` enables editor; `[ Save ]` writes file; `Ctrl+S` saves. | PASS |
| **TC-05** | Unsaved Changes Protection | Closing dirty tab prompts "Save changes to README.md?". | PASS |
| **TC-06** | External Modification Prompt | External edits prompt "Reload" / "Keep My Changes". | PASS |
| **TC-07** | Zinc Palette & Accents | Dark `#09090B` & Light `#FAFAFA` Zinc neutral palettes with 8 accents. | PASS |
| **TC-08** | In-Document Find (`Ctrl+F`) | Search highlights matches and shows match counts. | PASS |
| **TC-09** | Security & HTML Sanitization | `<script>` tags and `javascript:` URIs are neutralized. | PASS |
| **TC-10** | Offline Operation | Operates 100% offline with zero network requests. | PASS |
