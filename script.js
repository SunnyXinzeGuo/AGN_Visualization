// ---- Data description --------------------------------------------------

const quantityDefs = [
  { id: "I", folder: "I", label: "Total intensity (Stokes I)" },
  { id: "lp", folder: "lp", label: "Linear polarization (LP)" },
  { id: "cp", folder: "cp", label: "Circular polarization (CP)" },
  { id: "evpa", folder: "evpa", label: "EVPA" },
];

const spins = ["0", "0.9"];
const fields = ["MAD", "SANE"];
const angles = ["1", "30", "60", "90"];

// Automatically build list of all images based on naming scheme
const images = [];
const imageMap = new Map();

quantityDefs.forEach((q) => {
  spins.forEach((spin) => {
    fields.forEach((field) => {
      angles.forEach((angle) => {
        const filename = `${spin}_${field}_${angle}.png`;
        const path = `${q.folder}/${filename}`;
        const id = `${q.id}-${spin}-${field}-${angle}`;

        const entry = {
          id,
          quantityId: q.id,
          quantityLabel: q.label,
          folder: q.folder,
          spin,
          field,
          angle,
          filename,
          src: path,
        };

        images.push(entry);
        imageMap.set(id, entry);
      });
    });
  });
});

// Keep track of comparison selection (max 4 images)
let comparisonIds = [];

// ---- DOM helpers -------------------------------------------------------

function $(id) {
  return document.getElementById(id);
}

// ---- Filtering & gallery rendering -------------------------------------

function getFilters() {
  return {
    quantity: $("quantityFilter").value,
    spin: $("spinFilter").value,
    field: $("fieldFilter").value,
    angle: $("angleFilter").value,
  };
}

function imageMatchesFilters(img, filters) {
  if (filters.quantity && img.quantityId !== filters.quantity) return false;
  if (filters.spin && img.spin !== filters.spin) return false;
  if (filters.field && img.field !== filters.field) return false;
  if (filters.angle && img.angle !== filters.angle) return false;
  return true;
}

function renderGallery() {
  const galleryEl = $("gallery");
  const filters = getFilters();

  const filtered = images.filter((img) => imageMatchesFilters(img, filters));

  // Group by quantity so we can show headers I / LP / CP / EVPA
  const byQuantity = new Map();
  filtered.forEach((img) => {
    if (!byQuantity.has(img.quantityId)) byQuantity.set(img.quantityId, []);
    byQuantity.get(img.quantityId).push(img);
  });

  // Order quantities in the same order as quantityDefs
  galleryEl.innerHTML = "";
  quantityDefs.forEach((q) => {
    const group = byQuantity.get(q.id);
    if (!group || group.length === 0) return;

    const section = document.createElement("section");
    section.className = "quantity-group";

    const heading = document.createElement("div");
    heading.className = "quantity-heading";
    heading.innerHTML = `
      <span>${q.label}</span>
      <span class="quantity-label-pill">${q.id}</span>
    `;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "thumbnail-grid";

    // sort for nicer ordering: spin, field, angle
    group.sort((a, b) => {
      if (a.spin !== b.spin) return parseFloat(a.spin) - parseFloat(b.spin);
      if (a.field !== b.field) return a.field.localeCompare(b.field);
      return parseInt(a.angle) - parseInt(b.angle);
    });

    group.forEach((img) => {
      const card = document.createElement("article");
      card.className = "thumb-card";

      const inComparison = comparisonIds.includes(img.id);

      card.innerHTML = `
        <figure>
          <img src="${img.src}" alt="${img.quantityLabel}, spin ${img.spin}, ${
        img.field
      }, angle ${img.angle}°" loading="lazy">
        </figure>
        <div class="thumb-meta">
          <span><strong>a</strong> = ${img.spin}</span>
          <span>${img.field}</span>
          <span>${img.angle}&deg;</span>
        </div>
        <div class="thumb-button-row">
          <button class="btn small ${
            inComparison ? "primary" : ""
          }" data-compare-id="${img.id}">
            ${inComparison ? "In comparison" : "Add to comparison"}
          </button>
          <span style="font-size:0.7rem; color:#64748b;">
            ${img.filename}
          </span>
        </div>
      `;

      grid.appendChild(card);
    });

    section.appendChild(grid);
    galleryEl.appendChild(section);
  });

  // attach listeners for compare buttons
  galleryEl.querySelectorAll("[data-compare-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-compare-id");
      toggleComparison(id);
    });
  });
}

// ---- Comparison grid ---------------------------------------------------

function toggleComparison(imageId) {
  const index = comparisonIds.indexOf(imageId);

  if (index !== -1) {
    // remove if already there
    comparisonIds.splice(index, 1);
  } else {
    if (comparisonIds.length >= 4) {
      alert("You can compare at most 4 images at a time.");
      return;
    }
    comparisonIds.push(imageId);
  }

  renderComparison();
  renderGallery(); // refresh button states
}

function renderComparison() {
  const grid = $("comparison-grid");
  grid.innerHTML = "";

  const slots = 4;

  for (let i = 0; i < slots; i++) {
    const card = document.createElement("div");
    const id = comparisonIds[i];
    const img = id ? imageMap.get(id) : null;

    card.className = "comparison-card" + (img ? " filled" : "");

    if (img) {
      card.innerHTML = `
        <figure>
          <img src="${img.src}" alt="${img.quantityLabel}, spin ${
        img.spin
      }, ${img.field}, angle ${img.angle}°">
          <figcaption class="comparison-caption">
            <strong>${img.quantityId}</strong> —
            a = ${img.spin}, ${img.field}, ${img.angle}&deg;
            <br/>
            <span style="opacity:0.7;">${img.filename}</span>
          </figcaption>
        </figure>
      `;
    } else {
      card.innerHTML = `
        <div class="comparison-caption" style="margin:auto; text-align:center;">
          Empty slot. Add images from the gallery below.
        </div>
      `;
    }

    grid.appendChild(card);
  }
}

// ---- Init --------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // initial render
  renderComparison();
  renderGallery();

  // hook up filter events
  ["quantityFilter", "spinFilter", "fieldFilter", "angleFilter"].forEach(
    (id) => {
      $(id).addEventListener("change", renderGallery);
    }
  );
});
