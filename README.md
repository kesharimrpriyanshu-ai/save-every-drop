# Save Every Drop – Campus Water Conservation

**Course:** BU100 SDG Action Lab  
**Primary SDG:** SDG 6 – Clean Water and Sanitation  

## What This Project Does
**Save Every Drop** is a lightweight, beginner-friendly web intervention designed to help university students:
1. **Identify and report campus water wastage** (leaking taps, running faucets, water cooler issues, washroom wastage) with an optional photo.
2. **Build practical conservation habits** through 5 everyday campus water-saving tips with interactive action pledges.
3. **Measure student awareness** via a 5-question campus survey.
4. **Track and export evidence** through a live Chart.js Impact Dashboard and an Admin / Data panel with CSV export.

All data is stored locally in the browser using `localStorage`, requiring no backend server, database, or paid service. Every sample entry is explicitly labeled **Demo Data** so it is never confused with real collected evidence.

---

## File Structure
```text
save-every-drop/
├── index.html   # Page structure, forms, dashboard canvases, and project info
├── style.css    # Clean, responsive university-project styling (laptop + mobile)
├── data.js      # Clearly separated Demo Data and Actual Data configuration
├── script.js    # Form validation, localStorage persistence, charts, and CSV export
└── README.md    # Setup, data replacement, export, and viva guide