// State variables
let state = {
  IC_Viewport: 123, // Unconstrained center from viewport
  IC: 123, // Constrained center (affected by limits)
  WinN: 20,
  LimU: 148,
  LimL: 99,
  WinU: 0,
  WinL: 0,
  IT: 321, // Now user-controllable
};

// Initialize state.IC properly
state.IC = Math.max(
  Math.max(0, state.LimL),
  Math.min(state.LimU, Math.min(state.IT, state.IC_Viewport))
);

// Get DOM elements
const elements = {
  icViewportSlider: document.getElementById("icViewportSlider"),
  icSlider: document.getElementById("icSlider"),
  winNSlider: document.getElementById("winNSlider"),
  limUSlider: document.getElementById("limUSlider"),
  limLSlider: document.getElementById("limLSlider"),
  itSlider: document.getElementById("itSlider"),
  icViewportValue: document.getElementById("icViewportValue"),
  icValue: document.getElementById("icValue"),
  winNValue: document.getElementById("winNValue"),
  limUValue: document.getElementById("limUValue"),
  limLValue: document.getElementById("limLValue"),
  itValue: document.getElementById("itValue"),
  icViewportStatus: document.getElementById("icViewportStatus"),
  icConstrainedStatus: document.getElementById("icConstrainedStatus"),
  winUStatus: document.getElementById("winUStatus"),
  winLStatus: document.getElementById("winLStatus"),
  winUWarning: document.getElementById("winUWarning"),
  winLWarning: document.getElementById("winLWarning"),
  actualLength: document.getElementById("actualLength"),
  requestedLength: document.getElementById("requestedLength"),
  effectiveLength: document.getElementById("effectiveLength"),
  compensatedIndicator: document.getElementById("compensatedIndicator"),
  behaviorStatus: document.getElementById("behaviorStatus"),
  configStatus: document.getElementById("configStatus"),
  totalImages: document.getElementById("totalImages"),
  errorSection: document.getElementById("errorSection"),
  errorList: document.getElementById("errorList"),
  currentConstraints: document.getElementById("currentConstraints"),
  icConstraintText: document.getElementById("icConstraintText"),
  lengthCompensationText: document.getElementById("lengthCompensationText"),
  timelineTrack: document.getElementById("timelineTrack"),
  container2: document.getElementById("container2"),
};

// Calculate effective window length
function getEffectiveWinN() {
  if (state.WinN === 0) return 0;

  const maxPossibleByLimits = state.LimU - state.LimL;
  const maxPossibleByTotal = state.IT;
  const maxPossible = Math.min(maxPossibleByLimits, maxPossibleByTotal);

  const effectiveLength = Math.min(
    state.WinN,
    Math.max(0, Math.floor(maxPossible / 2) * 2)
  );
  return effectiveLength;
}

// Calculate window boundaries
function calculateWindowBoundaries() {
  const effectiveWinN = getEffectiveWinN();

  if (effectiveWinN === 0) {
    state.WinU = state.IC;
    state.WinL = state.IC;
    return;
  }

  const idealWinU = state.IC + effectiveWinN / 2;
  const idealWinL = state.IC - effectiveWinN / 2;

  let finalWinU, finalWinL;

  if (
    idealWinU <= Math.min(state.LimU, state.IT) &&
    idealWinL >= Math.max(state.LimL, 0)
  ) {
    finalWinU = idealWinU;
    finalWinL = idealWinL;
  } else if (idealWinU > Math.min(state.LimU, state.IT)) {
    finalWinU = Math.min(state.LimU, state.IT);
    finalWinL = finalWinU - effectiveWinN;
  } else if (idealWinL < Math.max(state.LimL, 0)) {
    finalWinL = Math.max(state.LimL, 0);
    finalWinU = finalWinL + effectiveWinN;
  }

  state.WinU = finalWinU;
  state.WinL = finalWinL;
}

// Get IC constraints
function getICConstraints() {
  const min = Math.max(0, state.LimL);
  const max = Math.min(state.IT, state.LimU);
  return { min, max };
}

// Detect constraint issues
function detectConstraintIssues() {
  const issues = [];

  if (state.WinL < 0) {
    issues.push(
      `Lower window boundary (${state.WinL}) below absolute minimum (0)`
    );
  }
  if (state.WinU > state.IT) {
    issues.push(
      `Upper window boundary (${state.WinU}) above absolute maximum (${state.IT})`
    );
  }
  if (state.IC < state.LimL) {
    issues.push(
      `Current image (${state.IC}) below lower limit (${state.LimL})`
    );
  }
  if (state.IC > state.LimU) {
    issues.push(
      `Current image (${state.IC}) above upper limit (${state.LimU})`
    );
  }

  return issues;
}

// Enforce constraints
function enforceConstraints() {
  // Ensure limits don't invert
  if (state.LimL > state.LimU) {
    state.LimU = state.LimL;
    elements.limUSlider.value = state.LimU;
    elements.limUSlider.max = state.IT;
  }
  if (state.LimU < state.LimL) {
    state.LimL = state.LimU;
    elements.limLSlider.value = state.LimL;
    elements.limLSlider.max = state.IT;
  }

  // Update slider maximums when IT changes
  elements.icViewportSlider.max = state.IT;
  elements.limUSlider.max = state.IT;
  elements.limLSlider.max = state.IT;
  elements.winNSlider.max = Math.floor(state.IT / 2) * 2;

  // Ensure values don't exceed IT
  if (state.IC_Viewport > state.IT) {
    state.IC_Viewport = state.IT;
    elements.icViewportSlider.value = state.IC_Viewport;
  }
  if (state.LimU > state.IT) {
    state.LimU = state.IT;
    elements.limUSlider.value = state.LimU;
  }
  if (state.LimL > state.IT) {
    state.LimL = state.IT;
    elements.limLSlider.value = state.LimL;
  }

  // Calculate constrained IC
  calculateConstrainedIC();
}
// Calculate constrained IC based on viewport IC and limits
function calculateConstrainedIC() {
  // The constrained IC should be:
  // 1. At least the maximum of 0 and LimL (lower bound)
  // 2. At most the minimum of LimU and IT (upper bound)
  // 3. Try to match IC_Viewport when possible within those constraints

  const lowerBound = Math.max(0, state.LimL);
  const upperBound = Math.min(state.LimU, state.IT);

  // Clamp IC_Viewport within the valid bounds
  state.IC = Math.max(lowerBound, Math.min(upperBound, state.IC_Viewport));
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
  const containerWidth = Math.min(timelineContainer.offsetWidth, 800);
  const getPosition = (value) => (value / state.IT) * containerWidth;

  // Create timeline numbers with dynamic spacing
  const numberStep = Math.max(1, Math.floor(state.IT / 12));
  for (let i = 0; i <= state.IT; i += numberStep) {
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

  const effectiveWinN = getEffectiveWinN();

  // Create window regions
  if (effectiveWinN > 0) {
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
  const limLLabel = document.createElement("div");
  limLLabel.className = "marker-label limit-label";
  limLLabel.textContent = `LimL (${state.LimL})`;
  limLMarker.appendChild(limLLabel);
  positionMarkers.appendChild(limLMarker);

  const limUMarker = document.createElement("div");
  limUMarker.className = "position-marker limit-marker";
  limUMarker.style.left = getPosition(state.LimU) + "px";
  const limULabel = document.createElement("div");
  limULabel.className = "marker-label limit-label";
  limULabel.textContent = `LimU (${state.LimU})`;
  limUMarker.appendChild(limULabel);
  positionMarkers.appendChild(limUMarker);

  // Window boundary markers (if different from IC_Viewport)
  if (effectiveWinN > 0) {
    if (state.WinL !== state.IC_Viewport) {
      const winLMarker = document.createElement("div");
      winLMarker.className = "position-marker window-boundary";
      winLMarker.style.left = getPosition(state.WinL) + "px";
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
      const winULabel = document.createElement("div");
      winULabel.className = "marker-label window-label";
      winULabel.textContent = `WinU (${state.WinU})`;
      winUMarker.appendChild(winULabel);
      positionMarkers.appendChild(winUMarker);
    }
  }

  // Set container widths
  timelineNumbers.style.width = containerWidth + "px";
  windowRegions.parentElement.style.width = containerWidth + "px";
  positionMarkers.style.width = containerWidth + "px";
  //   compensationIndicators.style.width = containerWidth + "px";
}

// Update all displays
function updateDisplay() {
  enforceConstraints();
  calculateWindowBoundaries();

  const effectiveWinN = getEffectiveWinN();
  const icConstraints = getICConstraints();
  const issues = detectConstraintIssues();

  // Update control values
  elements.icViewportValue.textContent = `${state.IC_Viewport} (free: 0-${state.IT})`;
  elements.icValue.textContent = `${state.IC} (auto-calculated)`;
  elements.winNValue.textContent = `${state.WinN} (compensates to: ${effectiveWinN})`;
  elements.itValue.textContent = `${state.IT} (system capacity)`;
  elements.limUValue.textContent = `${state.LimU} (auto-adjusts with LimL: 0-${state.IT})`;
  elements.limLValue.textContent = `${state.LimL} (auto-adjusts with LimU: 0-${state.IT})`;

  // Update constrained IC slider position (but keep it disabled)
  elements.icSlider.value = state.IC;
  elements.icSlider.min = icConstraints.min;
  elements.icSlider.max = icConstraints.max;

  // Update status
  elements.icViewportStatus.textContent = state.IC_Viewport;
  elements.icConstrainedStatus.textContent = state.IC;
  elements.winUStatus.textContent = state.WinU;
  elements.winLStatus.textContent = state.WinL;
  elements.actualLength.textContent = state.WinU - state.WinL;
  elements.requestedLength.textContent = state.WinN;
  elements.effectiveLength.textContent = effectiveWinN;
  elements.totalImages.textContent = state.IT;

  // Show/hide warnings
  elements.winUWarning.style.display =
    state.WinU > Math.min(state.LimU, state.IT) ? "block" : "none";
  elements.winLWarning.style.display =
    state.WinL < Math.max(state.LimL, 0) ? "block" : "none";
  elements.compensatedIndicator.style.display =
    state.WinN !== effectiveWinN ? "block" : "none";

  // Update behavior status
  let behavior = "";
  if (effectiveWinN === 0) {
    behavior = "Zero Length";
  } else {
    const idealWinU = state.IC_Viewport + effectiveWinN / 2;
    const idealWinL = state.IC_Viewport - effectiveWinN / 2;
    const upperHit = idealWinU > Math.min(state.LimU, state.IT);
    const lowerHit = idealWinL < Math.max(state.LimL, 0);

    if (upperHit && lowerHit) behavior = "Both sides compensating";
    else if (upperHit) behavior = "Lower side compensating";
    else if (lowerHit) behavior = "Upper side compensating";
    else behavior = "Centered normally";

    if (state.WinN !== effectiveWinN) behavior += " + Length reduced";
  }
  elements.behaviorStatus.textContent = behavior;

  // Update configuration status
  const isValid = issues.length === 0;
  elements.configStatus.textContent = isValid ? "Valid" : "Invalid";
  elements.configStatus.className = isValid
    ? "status-value valid"
    : "status-value invalid";

  // Update errors
  if (issues.length > 0) {
    elements.errorSection.style.display = "block";
    elements.errorList.innerHTML = issues
      .map((issue) => `<li class="error-item">• ${issue}</li>`)
      .join("");
  } else {
    elements.errorSection.style.display = "none";
  }

  // Update constraints text
  elements.currentConstraints.textContent = `Current: 0 ≤ ${state.LimL} ≤ ${
    state.IC
  } ≤ ${state.LimU} ≤ ${state.IT}, ${state.WinU} - ${state.WinL} = ${
    state.WinU - state.WinL
  } (effective: ${effectiveWinN})`;
  elements.icConstraintText.textContent = `IC = ${
    state.IC
  } (constrained by limits: ${Math.max(0, state.LimL)} ≤ IC ≤ ${Math.min(
    state.IT,
    state.LimU
  )})`;
  elements.lengthCompensationText.textContent = `Requested ${
    state.WinN
  } → Effective ${effectiveWinN} (limited by space: ${
    state.LimU - state.LimL
  })`;

  // Update viewport center text
  const viewportCenterText = document.getElementById("viewportCenterText");
  if (viewportCenterText) {
    viewportCenterText.textContent = `IC_Viewport = ${state.IC_Viewport} (free-moving from 0 to ${state.IT})`;
  }

  updateVisualization();
}

// Event handlers
elements.timelineTrack.addEventListener("mouseover", (e) => {
  document.documentElement.classList.add("no-scroll");
});

elements.timelineTrack.addEventListener("mouseout", (e) => {
  document.documentElement.classList.remove("no-scroll");
});

elements.timelineTrack.addEventListener("wheel", (e) => {
  // If scroll up

  if (e.altKey) {
    let step = 2;
    if (e.shiftKey) step = 6;
    if (e.deltaY < 0) {
      state.WinN += step;
    } else if (e.deltaY > 0) {
      state.WinN -= step;
    }

    elements.winNSlider.value = state.WinN;
  } else {
    let step = 1;
    if (e.shiftKey) step = 10;
    if (e.deltaY < 0) {
      state.IC_Viewport += step;
    } else if (e.deltaY > 0) {
      state.IC_Viewport -= step;
    }

    elements.icViewportSlider.value = state.IC_Viewport;
  }
  updateDisplay();
});

elements.icViewportSlider.addEventListener("input", (e) => {
  state.IC_Viewport = parseInt(e.target.value);
  updateDisplay();
});

elements.winNSlider.addEventListener("input", (e) => {
  state.WinN = parseInt(e.target.value) * 2;
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
