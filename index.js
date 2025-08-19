// --- Drag support for markers ---
const positionLayer = document.getElementById("positionMarkers");

// Get DOM elements
const elements = {
  icViewportSlider: document.getElementById("icViewportSlider"),
  winNSlider: document.getElementById("winNSlider"),
  limUSlider: document.getElementById("limUSlider"),
  limLSlider: document.getElementById("limLSlider"),
  itSlider: document.getElementById("itSlider"),
  icViewportValue: document.getElementById("icViewportValue"),
  winNValue: document.getElementById("winNValue"),
  limUValue: document.getElementById("limUValue"),
  limLValue: document.getElementById("limLValue"),
  itValue: document.getElementById("itValue"),
  icConstrainedStatus: document.getElementById("icConstrainedStatus"),
  winUStatus: document.getElementById("winUStatus"),
  winLStatus: document.getElementById("winLStatus"),
  actualLength: document.getElementById("actualLength"),
  timelineContainer: document.getElementById("timelineContainer"),
};

// State variables
let state = {
  IC_Viewport: parseInt(icViewportSlider.value), // Unconstrained center from viewport
  IC: parseInt(icViewportSlider.value), // Constrained center (affected by limits)
  WinN: parseInt(winNSlider.value),
  LimU: parseInt(limUSlider.value),
  LimL: parseInt(limLSlider.value),
  WinU: 0,
  WinL: 0,
  IT: parseInt(itSlider.value),
  effectiveWinN: 40,
  dragging: null, // { type: 'icViewport'|'limL'|'limU'|'winL'|'winU' }
};

// Calculate effective window length
function getEffectiveWinN() {
  if (state.WinN === 0) {
    state.effectiveWinN = 0;
  } else {
    const maxPossibleByLimits = state.LimU - state.LimL;
    const maxPossibleByTotal = state.IT;
    const maxPossible = Math.min(maxPossibleByLimits, maxPossibleByTotal);

    state.effectiveWinN = Math.min(state.WinN, Math.max(0, maxPossible));
  }
}

// Calculate window boundaries
function calculateWindowBoundaries() {
  if (state.effectiveWinN === 0) {
    state.WinU = state.IC;
    state.WinL = state.IC;
    return;
  }

  const idealWinU = state.IC + state.effectiveWinN / 2;
  const idealWinL = state.IC - state.effectiveWinN / 2;

  let finalWinU, finalWinL;

  if (
    idealWinU <= Math.min(state.LimU, state.IT) &&
    idealWinL >= Math.max(state.LimL, 0)
  ) {
    finalWinU = idealWinU;
    finalWinL = idealWinL;
  } else if (idealWinU > Math.min(state.LimU, state.IT)) {
    finalWinU = Math.min(state.LimU, state.IT);
    finalWinL = finalWinU - state.effectiveWinN;
  } else if (idealWinL < Math.max(state.LimL, 0)) {
    finalWinL = Math.max(state.LimL, 0);
    finalWinU = finalWinL + state.effectiveWinN;
  }

  state.WinU = finalWinU;
  state.WinL = finalWinL;
}

// Enforce constraints
function enforceConstraints() {
  // Ensure limits don't invert
  if (state.LimU <= state.LimL || state.LimL > state.LimU) {
    const tempLimL = state.LimU;
    const tempLimU = state.LimL;
    state.LimL = tempLimL;
    state.LimU = tempLimU;
  }

  elements.limLSlider.value = state.LimL;
  elements.limUSlider.value = state.LimU;
  // Update slider values if limits were adjusted

  // Update slider maximums when IT changes
  elements.limLSlider.max = state.IT;
  elements.limUSlider.max = state.IT;
  elements.icViewportSlider.max = state.IT;
  elements.winNSlider.max = state.IT;

  // Ensure values don't exceed IT
  state.IC_Viewport = Math.min(state.IC_Viewport, state.IT);
  elements.icViewportSlider.value = state.IC_Viewport;
  if (state.LimU > state.IT) {
    state.LimU = state.IT;
    elements.limUSlider.value = state.LimU;
  }
  if (state.LimL > state.IT) {
    state.LimL = state.IT;
    elements.limLSlider.value = state.LimL;
  }
}
// Calculate constrained IC based on viewport IC and limits
function calculateConstrainedIC() {
  // The constrained IC should be:
  // 1. At least the maximum of 0 and LimL (lower bound)
  // 2. At most the minimum of LimU and IT (upper bound)
  // 3. Try to match IC_Viewport when possible within those constraints

  const lowerBound = Math.max(0, state.LimL);
  const upperBound = Math.min(state.LimU, state.IT);

  if (upperBound - lowerBound < state.WinN) {
    state.IC = Math.round((upperBound + lowerBound) / 2);
  } else {
    // Clamp IC_Viewport within the valid bounds
    state.IC = state.IC_Viewport;
    if (state.IC - Math.round(state.WinN / 2) < lowerBound) {
      state.IC = lowerBound + Math.round(state.WinN / 2);
    }
    if (state.IC + Math.round(state.WinN / 2) + 1 > upperBound) {
      state.IC = upperBound - Math.round(state.WinN / 2);
    }
    state.IC = Math.min(upperBound, Math.max(lowerBound, state.IC));
  }
}
// Update visualization with horizontal timeline
function updateVisualization() {
  const timelineNumbers = document.getElementById("timelineNumbers");
  const windowRegions = document.getElementById("windowRegions");
  const positionMarkers = document.getElementById("positionMarkers");
  //   const compensationIndicators = document.getElementById(
  //     "compensationIndicators"
  //   );
  const timelineContainer = document.querySelector(".timeline-container");

  // Clear existing content
  timelineNumbers.innerHTML = "";
  windowRegions.innerHTML = "";
  positionMarkers.innerHTML = "";
  //   compensationIndicators.innerHTML = "";

  // Use responsive width
  const containerWidth = timelineContainer.offsetWidth;
  const getPosition = (value) => (value / state.IT) * containerWidth;

  // Create timeline numbers with dynamic spacing
  const numberStep = Math.max(1, Math.round(state.IT / 12));
  for (let i = 1; i <= state.IT; i += numberStep) {
    const numberEl = document.createElement("div");
    numberEl.className = "timeline-number";
    if (i % (numberStep * 2) === 0 || i === 0 || i === state.IT) {
      numberEl.className += " major";
    }
    numberEl.style.left = getPosition(i) + "px";
    numberEl.textContent = i;
    timelineNumbers.appendChild(numberEl);
  }

  // Add final number if not already shown
  if (state.IT % numberStep !== 0) {
    const numberEl = document.createElement("div");
    numberEl.className = "timeline-number major";
    numberEl.style.left = getPosition(state.IT) + "px";
    numberEl.textContent = state.IT;
    timelineNumbers.appendChild(numberEl);
  }

  // Create window regions
  if (state.effectiveWinN > 0) {
    // Lower window region (IC_Viewport to WinL)
    if (state.WinL < state.IC) {
      const lowerRegion = document.createElement("div");
      lowerRegion.className = "window-region";

      // Check if this region exceeds lower limit
      const exceedsLowerLimit = state.WinL < Math.max(state.LimL, 0);
      if (exceedsLowerLimit) {
        lowerRegion.className += " window-compensation-zone";
      } else {
        lowerRegion.className += " window-lower-compensation";
      }

      const leftPos = getPosition(state.WinL);
      const rightPos = getPosition(state.IC);
      lowerRegion.style.left = leftPos + "px";
      lowerRegion.style.width = rightPos - leftPos + "px";
      windowRegions.appendChild(lowerRegion);
    }

    // Upper window region (IC_Viewport to WinU)
    if (state.WinU > state.IC) {
      const upperRegion = document.createElement("div");
      upperRegion.className = "window-region";

      // Check if this region exceeds upper limit
      const exceedsUpperLimit = state.WinU > Math.min(state.LimU, state.IT);
      if (exceedsUpperLimit) {
        upperRegion.className += " window-compensation-zone";
      } else {
        upperRegion.className += " window-upper-compensation";
      }

      const leftPos = getPosition(state.IC);
      const rightPos = getPosition(state.WinU);
      upperRegion.style.left = leftPos + "px";
      upperRegion.style.width = rightPos - leftPos + "px";
      windowRegions.appendChild(upperRegion);
    }
  }

  // Create position markers

  // Viewport IC marker (most prominent)
  const icViewportMarker = document.createElement("div");
  icViewportMarker.className = "position-marker ic-marker";
  icViewportMarker.style.left = getPosition(state.IC_Viewport) + "px";
  icViewportMarker.dataset.marker = "icViewport";

  const icViewportLabel = document.createElement("div");
  icViewportLabel.className = "marker-label ic-label";
  icViewportLabel.textContent = `IC_V (${state.IC_Viewport})`;
  icViewportMarker.appendChild(icViewportLabel);
  positionMarkers.appendChild(icViewportMarker);

  // Constrained IC marker (if different from viewport)
  if (state.IC !== state.IC_Viewport) {
    const icConstrainedMarker = document.createElement("div");
    icConstrainedMarker.className = "position-marker ic-constrained-marker";
    icConstrainedMarker.style.left = getPosition(state.IC) + "px";
    icConstrainedMarker.dataset.marker = "ic";

    const icConstrainedLabel = document.createElement("div");
    icConstrainedLabel.className = "marker-label ic-constrained-label";
    icConstrainedLabel.textContent = `IC (${state.IC})`;
    icConstrainedMarker.appendChild(icConstrainedLabel);
    positionMarkers.appendChild(icConstrainedMarker);
  }

  // Limit markers
  const limLMarker = document.createElement("div");
  limLMarker.className = "position-marker limit-marker";
  limLMarker.style.left = getPosition(state.LimL) + "px";
  limLMarker.dataset.marker = "limL";

  const limLLabel = document.createElement("div");
  limLLabel.className = "marker-label limit-label";
  limLLabel.textContent = `LimL (${state.LimL})`;
  limLMarker.appendChild(limLLabel);
  positionMarkers.appendChild(limLMarker);

  const limUMarker = document.createElement("div");
  limUMarker.className = "position-marker limit-marker";
  limUMarker.style.left = getPosition(state.LimU) + "px";
  limUMarker.dataset.marker = "limU";

  const limULabel = document.createElement("div");
  limULabel.className = "marker-label limit-label";
  limULabel.textContent = `LimU (${state.LimU})`;
  limUMarker.appendChild(limULabel);
  positionMarkers.appendChild(limUMarker);

  // Window boundary markers (if different from IC_Viewport)
  if (state.effectiveWinN > 0) {
    if (state.WinL !== state.IC_Viewport) {
      const winLMarker = document.createElement("div");
      winLMarker.className = "position-marker window-boundary";
      winLMarker.style.left = getPosition(state.WinL) + "px";
      winLMarker.dataset.marker = "winL";

      const winLLabel = document.createElement("div");
      winLLabel.className = "marker-label window-label";
      winLLabel.textContent = `WinL (${state.WinL})`;
      winLMarker.appendChild(winLLabel);
      positionMarkers.appendChild(winLMarker);
    }

    if (state.WinU !== state.IC_Viewport) {
      const winUMarker = document.createElement("div");
      winUMarker.className = "position-marker window-boundary";
      winUMarker.style.left = getPosition(state.WinU) + "px";
      winUMarker.dataset.marker = "winU";

      const winULabel = document.createElement("div");
      winULabel.className = "marker-label window-label";
      winULabel.textContent = `WinU (${state.WinU})`;
      winUMarker.appendChild(winULabel);
      positionMarkers.appendChild(winUMarker);
    }
  }

  // If Marker is being dragged
  if (state.dragging) {
    const marker = positionMarkers.querySelector(
      `.position-marker[data-marker="${state.dragging.type}"]`
    );
    if (marker) {
      marker.classList.add("dragging");
    }
  }
  // Set container widths
  timelineNumbers.style.width = containerWidth + "px";
  windowRegions.parentElement.style.width = containerWidth + "px";
  positionMarkers.style.width = containerWidth + "px";
  //   compensationIndicators.style.width = containerWidth + "px";
}

function pxToValue(clientX) {
  const rect = positionLayer.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  return Math.round((x / rect.width) * state.IT);
}

function startDrag(target) {
  const type = target?.dataset?.marker;
  if (!type) return;
  // Make constrained IC read-only (comment next line to enable)
  if (type === "ic") return;
  if (type === "winU") return;
  if (type === "winL") return;
  state.dragging = { type };
  target.classList.add("dragging");
  document.documentElement.style.cursor = "grabbing";
}

function startHover(target) {
  if (state.dragging) return;
  const type = target?.dataset?.marker;
  if (!type) return;
  // Make constrained IC read-only (comment next line to enable)
  if (type === "ic") return;
  if (type === "winU") return;
  if (type === "winL") return;
  target.classList.add("hover");
  document.documentElement.style.cursor = "grab";
}

function endHover(target) {
  if (state.dragging) return;
  const type = target?.dataset?.marker;
  if (!type) return;
  target.classList.remove("hover");
  document.documentElement.style.cursor = "default";
}

function endDrag() {
  if (!state.dragging) return;
  const els = positionLayer.querySelectorAll(".position-marker.dragging");
  els.forEach((el) => el.classList.remove("dragging"));
  state.dragging = null;

  document.documentElement.style.cursor = "default";
}

function doDrag(clientX) {
  if (!state.dragging) return;
  const val = Math.max(0, Math.min(state.IT, pxToValue(clientX)));

  switch (state.dragging.type) {
    case "icViewport":
      state.IC_Viewport = val;
      elements.icViewportSlider.value = state.IC_Viewport;
      break;
    case "limL":
      state.LimL = val;
      elements.limLSlider.value = state.LimL;
      break;
    case "limU":
      state.LimU = val;
      elements.limUSlider.value = state.LimU;
      break;
    case "winL":
    case "winU":
      const newLen = Math.abs(val - state.IC) * 2;
      state.WinN = Math.min(parseInt(elements.winNSlider.max), newLen);
      elements.winNSlider.value = state.WinN;
      break;
  }
  updateDisplay();
}

// Mouse
positionLayer.addEventListener("mousedown", (e) => {
  const m = e.target.closest(".position-marker");
  if (!m) return;
  startDrag(m);
});

positionLayer.addEventListener("mouseover", (e) => {
  const m = e.target.closest(".position-marker");
  if (!m) return;
  startHover(m);
});

positionLayer.addEventListener("mouseout", (e) => {
  const m = e.target.closest(".position-marker");
  if (!m) return;
  endHover(m);
});

elements.timelineContainer.addEventListener("mousemove", (e) =>
  doDrag(e.clientX)
);
elements.timelineContainer.addEventListener("mouseup", endDrag);

// Touch
positionLayer.addEventListener(
  "touchstart",
  (e) => {
    const m = e.target.closest(".position-marker");
    if (!m) return;
    startDrag(m);
    if (e.cancelable) e.preventDefault();
  },
  { passive: false }
);

elements.timelineContainer.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    if (!t) return;
    doDrag(t.clientX);
  },
  { passive: false }
);

elements.timelineContainer.addEventListener("touchend", endDrag);
elements.timelineContainer.addEventListener("touchcancel", endDrag);
// --- end drag support ---

// Update all displays
function updateDisplay() {
  enforceConstraints();
  getEffectiveWinN();
  calculateWindowBoundaries();
  calculateConstrainedIC();

  // Update control values
  elements.icViewportValue.textContent = `${state.IC_Viewport}`;
  elements.winNValue.textContent = `${state.WinN}`;
  elements.limLValue.textContent = `${state.LimL}`;
  elements.limUValue.textContent = `${state.LimU}`;
  elements.itValue.textContent = `${state.IT}`;

  // Update status
  elements.icConstrainedStatus.textContent = state.IC;
  elements.winUStatus.textContent = state.WinU;
  elements.winLStatus.textContent = state.WinL;
  elements.actualLength.textContent = state.WinU - state.WinL;

  // Show/hide warnings
  if (state.WinN !== state.effectiveWinN) {
    elements.actualLength.classList.add("orange-text");
    elements.actualLength.classList.add("text-darken-2");
  } else {
    elements.actualLength.classList.remove("orange-text");
    elements.actualLength.classList.remove("text-darken-2");
  }

  if (state.IC_Viewport !== state.IC) {
    elements.icConstrainedStatus.classList.add("orange-text");
    elements.icConstrainedStatus.classList.add("text-darken-2");
  } else {
    elements.icConstrainedStatus.classList.remove("orange-text");
    elements.icConstrainedStatus.classList.remove("text-darken-2");
  }

  // Update behavior status
  let behavior = "";
  if (state.effectiveWinN === 0) {
    behavior = "Zero Length";
  } else {
    const idealWinU = state.IC_Viewport + state.effectiveWinN / 2;
    const idealWinL = state.IC_Viewport - state.effectiveWinN / 2;
    const upperHit = idealWinU > Math.min(state.LimU, state.IT);
    const lowerHit = idealWinL < Math.max(state.LimL, 0);

    if (upperHit && lowerHit) behavior = "Both sides compensating";
    else if (upperHit) behavior = "Lower side compensating";
    else if (lowerHit) behavior = "Upper side compensating";
    else behavior = "Centered normally";

    if (state.WinN !== state.effectiveWinN) behavior += " + Length reduced";
  }

  // Update viewport center text
  const viewportCenterText = document.getElementById("viewportCenterText");
  if (viewportCenterText) {
    viewportCenterText.textContent = `IC_Viewport = ${state.IC_Viewport} (free-moving from 0 to ${state.IT})`;
  }

  updateVisualization();
}

elements.icViewportSlider.addEventListener("input", (e) => {
  state.IC_Viewport = parseInt(e.target.value);
  updateDisplay();
});

elements.winNSlider.addEventListener("input", (e) => {
  state.WinN = parseInt(e.target.value);
  updateDisplay();
});

elements.itSlider.addEventListener("input", (e) => {
  state.IT = parseInt(e.target.value);
  updateDisplay();
});

elements.limUSlider.addEventListener("input", (e) => {
  const newValue = parseInt(e.target.value);
  if (newValue < state.LimL) {
    state.LimL = newValue;
    elements.limLSlider.value = newValue;
  }
  state.LimU = newValue;
  updateDisplay();
});

elements.limLSlider.addEventListener("input", (e) => {
  const newValue = parseInt(e.target.value);
  if (newValue > state.LimU) {
    state.LimU = newValue;
    elements.limUSlider.value = newValue;
  }
  state.LimL = newValue;
  updateDisplay();
});

// Initialize
updateDisplay();

// Make visualization responsive to window resize
window.addEventListener("resize", () => {
  updateDisplay();
});
