# Microsoft Store Compliance Report - AburMD

**Publisher**: AburMD Software  
**Product**: AburMD v1.0.0  
**Target Platform**: Windows 10/11 (MSIX Win32 Desktop Bridge)  

---

## Store Policy Audit & Compliance Checklist

| Policy Requirement | Implementation & Verification Status | Compliance |
| :--- | :--- | :--- |
| **10.1 Product Value & Originality** | AburMD provides a fast, minimalist local Markdown reader and multi-tab editor. | ✅ Compliant |
| **10.2 Security & Least Privilege** | Requests minimal `runFullTrust` Win32 capability. Zero network telemetry. | ✅ Compliant |
| **10.5 Privacy Policy** | Factual privacy policy provided in `PRIVACY.md` detailing 100% offline local processing. | ✅ Compliant |
| **10.8 Advertising & In-App Purchases** | No ads, no in-app purchases, no subscription walls. | ✅ Compliant |
| **10.13 External Links** | Intercepts web URLs and opens safely in external system browser. | ✅ Compliant |
| **10.14 Local Input Validation** | HTML sanitization preventing script injection or unsafe `javascript:` links. | ✅ Compliant |

---

## Technical Audit Findings
- **Security**: Raw Markdown HTML is sanitized via `internal/security/sanitize.go`.
- **Telemetry**: Zero network background calls or analytics endpoints.
- **Uninstall**: Clean removal without leaving orphaned system services.
