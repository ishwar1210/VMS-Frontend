# Recently Installed Packages

These packages were added while implementing Excel upload and PDF export features in the project.

Packages

- `jspdf` — client-side PDF generation library.
- `jspdf-autotable` — a plugin for `jspdf` to render tables (used for the "Vendor Team Member" table).
- `xlsx` — read and parse Excel (`.xlsx`) files in the browser.
- `react-webcam` — for open camera in website
-

Install (PowerShell)

```powershell
cd Spectrum
npm install jspdf jspdf-autotable xlsx
```

Install (PowerShell)

```powershell
cd Spectrum
npm install react-webcam
```

Run dev server (PowerShell)

```powershell
cd Spectrum
npm run dev
```

Where it's used

- `src/components/Vendorgetpass.tsx` — reads Excel file with `xlsx`, posts rows to the backend and uses `jspdf` + `jspdf-autotable` to generate the appointment PDF.

Quick notes

- Excel template expected columns (header names): `Name`, `DocumentType`, `IdProofNo`, `MobileNo`.
- The upload flow requires selecting a Vendor Appointment ID (the component attempts to auto-select the newly created appointment).
- If the PDF download or upload fails, check the browser console for detailed payload and server response logs (the component logs payloads and server errors).

Want more?

- I can append this into the main `README.md`, add example payloads, or add a small UI debug panel showing last request/response.
