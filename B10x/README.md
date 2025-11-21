# Vendor Management Software

Web prototype built with **HTML**, **CSS**, and **JavaScript**. The interface is optimized for banks that need to onboard, vet, and manage **5,000+ vendors** with high security controls, maker-checker flows, 90-day password policies, and renewal automation.

## Project Structure

- `index.html` – Dedicated corporate login page with only User ID, Password, Role, and Forgot Password actions.
- `dashboard.html` – Authenticated workspace for admin portal, maker workflow, verification, assignments, vendor self-service, and integrations.
- `style.css` – Phusia (fuchsia) themed bank-grade UI styling with responsive layouts.
- `script.js` – Front-end logic, validations, autos, and simulated data storage via in-memory + localStorage state (including default admin seeding).
- `assets/company-logo/` – Dedicated folder for corporate logos (`logo-placeholder.svg` included).
- `data-vault/` – Placeholder folder to represent segregated database/document storage.

## Key Capabilities

- **Role-based login**: Admin, Branch, Vendor with mandatory role selection, Forgot Password escalation, 90-day reminders, and a first-login password change modal for every user.
- **Page-wise workflow**: Each workspace now includes Save & Continue buttons so operators progress page by page (Admin → Maker → Assignment → Billing → Integrations).
- **User administration**: Admin panel captures User Name, Branch, Branch Code, Zone, Email, Mobile, User ID, password, password reset date, and granular authorisation checkboxes (Onboarding, Verification, Billing, Assignments, API, Data Upload).
- **Default admin seeding**: A backend-style default admin (`User ID: Admin`, `Password: Password`) is auto-created in `localStorage` so the platform is manageable on first launch.
- **Branch & schema builder**: Capture branch code/name/zone/state and add multi-line addresses with PIN validation. Admin can add custom fields, dropdowns, and document templates anytime.
- **Maker onboarding**: Capture vendor master data, GST, address, contact, select validity (1–10 years), upload multi documents with naming, and submit for verifier review.
- **Verification workflow**: Approve (auto-generate 5-digit vendor code saved for assignments) or raise queries. Renewal alerts trigger 30 days before expiry.
- **Bulk operations & data uploads**: Admin submenu provides a dedicated data upload form for legal/technical/PD/FI/FCU/RCU assignments, while makers can import Excel renewals.
- **Assignments & branch control**: Assign cases via Excel or manual branch-level, ensure selection of vendors per zone.
- **Vendor self-service & billing**: Vendors login to review billing month, invoice number/date, update rates, GST %, add multi-line billing entries, attach DSC/NDC, and see payment status.
- **Document governance**: Multi-file upload, maker-checker approvals, and instructions to store per-vendor files inside secure vault folders.
- **Integration-ready**: Capture API endpoints (OAuth2, API key, mTLS) to link with other software like CBS, treasury, or compliance engines.
- **Security posture**: TLS-ready, salted hashes, adaptive throttling, API linking, password rotation tracking, OTP flows, and audit hints embedded in UI copy.

## Usage

1. Open `index.html` in any modern browser. No build step is required.
2. Sign in with the seeded admin (`User ID: Admin`, `Password: Password`, Role: Admin`). The password-change modal appears immediately—set a new credential before proceeding.
3. Use the Admin submenu (Add User → Data Upload → Field Builder) and the Save & Continue buttons to progress page by page while you add users and import data.
4. The dashboard automatically adjusts menus to the active role (Admin, Maker, Branch, Vendor). Continue through Maker, Assignment, Billing, and Integration pages via Save & Continue.
5. Approve vendors in the verification queue to generate secure vendor codes for assignments and billing.
6. Vendors update billing month, invoice number/date, rates, GST, and multi-line billing entries under the Billing page while attaching DSC/NDC files.
7. Explore bulk upload, assignment, billing, GST updates, and API integration lists—renewal alerts continue to simulate reminders.

## Customization Ideas

- Replace `assets/company-logo/logo-placeholder.svg` with your corporate logo (same filename or update `index.html`).
- Persist state using browser storage, IndexedDB, or connect to a backend/database inside `data-vault/`.
- Integrate actual API calls for OTP, email, document storage, or payment updates.
- Add authentication hooks and encryption libraries for production-ready deployments.

## Notes

- The UI enforces 10-digit mobile validation and 3-line address entry with PIN.
- The background uses a **Phusia** gradient per the requirement.
- All documents and data references are pointed to dedicated folders to keep storage isolated and auditable.

