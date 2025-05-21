// --- DOM Elements ---
const winsCountElement = document.getElementById("winsCount");
const lossesCountElement = document.getElementById("lossesCount");
const winRateElement = document.getElementById("winRate");
const currentDeckNameDisplay = document.getElementById(
  "currentDeckNameDisplay"
);

const winButton = document.getElementById("winButton");
const lossButton = document.getElementById("lossButton");
const resetButton = document.getElementById("resetButton");

const newDeckNameInput = document.getElementById("newDeckName");
const addDeckButton = document.getElementById("addDeckButton");
const deckSelector = document.getElementById("deckSelector");
const deleteDeckButton = document.getElementById("deleteDeckButton");

const themeCheckbox = document.getElementById("themeCheckbox");
const pieChartCanvas = document.getElementById("decksPieChart");
const performanceChartCanvas = document.getElementById(
  "winratePerformanceChart"
);

// --- State Variables ---
let decks = [];
let currentDeckIndex = -1;
const localStorageKeyDecks = "multiDeckTrackerData";
const localStorageKeyTheme = "multiDeckTrackerTheme";
let pieChartInstance = null;
let performanceChartInstance = null;

// --- Chart Color Palettes ---
const lightModeColors = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8CFF63",
  "#63C8FF",
  "#FFB5E8",
  "#E6E6FA",
  "#FFD700",
  "#ADFF2F",
];
const darkModeColors = [
  "#E55070",
  "#2F8ED6",
  "#E0B840",
  "#3EABA0",
  "#8A58E0",
  "#E08F30",
  "#7AE050",
  "#50B0E0",
  "#E0A0D0",
  "#D0D0E0",
  "#E0C000",
  "#9EE020",
];
const barChartColorsLight = [
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#FF6384",
];
const barChartColorsDark = [
  "#2F8ED6",
  "#E0B840",
  "#3EABA0",
  "#8A58E0",
  "#E08F30",
  "#E55070",
];

// --- Theme Functions ---
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    themeCheckbox.checked = true;
  } else {
    document.body.classList.remove("dark-mode");
    themeCheckbox.checked = false;
  }
  renderDecksPieChart();
  renderWinratePerformanceChart();
}

function toggleTheme() {
  if (themeCheckbox.checked) {
    applyTheme("dark");
    localStorage.setItem(localStorageKeyTheme, "dark");
  } else {
    applyTheme("light");
    localStorage.setItem(localStorageKeyTheme, "light");
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(localStorageKeyTheme);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  }
}

// --- Core Functions ---
function updateDisplay() {
  if (currentDeckIndex > -1 && decks[currentDeckIndex]) {
    const currentDeck = decks[currentDeckIndex];
    winsCountElement.textContent = currentDeck.wins;
    lossesCountElement.textContent = currentDeck.losses;
    currentDeckNameDisplay.textContent = `Stats for: ${currentDeck.name}`;
    const totalGames = currentDeck.wins + currentDeck.losses;
    if (totalGames > 0) {
      const rate = (currentDeck.wins / totalGames) * 100;
      winRateElement.textContent = rate.toFixed(2) + "%";
    } else {
      winRateElement.textContent = "N/A";
    }
    winButton.disabled = false;
    lossButton.disabled = false;
    resetButton.disabled = false;
    deleteDeckButton.disabled = false;
  } else {
    winsCountElement.textContent = "0";
    lossesCountElement.textContent = "0";
    winRateElement.textContent = "N/A";
    currentDeckNameDisplay.textContent = "No Deck Selected";
    winButton.disabled = true;
    lossButton.disabled = true;
    resetButton.disabled = true;
    deleteDeckButton.disabled = true;
  }
  renderDecksPieChart();
  renderWinratePerformanceChart();
}

function saveDecks() {
  localStorage.setItem(localStorageKeyDecks, JSON.stringify(decks));
}

function loadDecks() {
  const savedDecksData = localStorage.getItem(localStorageKeyDecks);
  if (savedDecksData) {
    decks = JSON.parse(savedDecksData);
  } else {
    decks = [];
  }
  populateDeckSelector();
  if (decks.length > 0) {
    const lastSelected = localStorage.getItem("lastSelectedDeckIndex");
    if (lastSelected !== null && decks[parseInt(lastSelected)]) {
      currentDeckIndex = parseInt(lastSelected);
    } else {
      currentDeckIndex = 0;
    }
    deckSelector.value = currentDeckIndex;
  } else {
    currentDeckIndex = -1;
  }
  updateDisplay();
}

function populateDeckSelector() {
  deckSelector.innerHTML = '<option value="-1">-- Select a Deck --</option>';
  decks.forEach((deck, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = deck.name;
    deckSelector.appendChild(option);
  });
  if (currentDeckIndex > -1) {
    deckSelector.value = currentDeckIndex;
  } else if (decks.length === 0) {
    deckSelector.value = "-1";
  }
}

function addDeck() {
  const deckName = newDeckNameInput.value.trim();
  if (deckName === "") {
    alert("Please enter a deck name.");
    return;
  }
  if (
    decks.some((deck) => deck.name.toLowerCase() === deckName.toLowerCase())
  ) {
    alert("A deck with this name already exists.");
    return;
  }
  const newDeck = { name: deckName, wins: 0, losses: 0 };
  decks.push(newDeck);
  currentDeckIndex = decks.length - 1;
  saveDecks();
  populateDeckSelector();
  deckSelector.value = currentDeckIndex;
  newDeckNameInput.value = "";
  updateDisplay();
}

function deleteSelectedDeck() {
  if (currentDeckIndex === -1 || !decks[currentDeckIndex]) {
    alert("No deck selected to delete.");
    return;
  }
  const deckNameToDelete = decks[currentDeckIndex].name;
  if (
    confirm(
      `Are you sure you want to delete the deck "${deckNameToDelete}" and all its stats?`
    )
  ) {
    decks.splice(currentDeckIndex, 1);
    currentDeckIndex = decks.length > 0 ? 0 : -1;
    saveDecks();
    populateDeckSelector();
    localStorage.setItem("lastSelectedDeckIndex", currentDeckIndex);
    updateDisplay();
  }
}

// --- Event Listeners ---
themeCheckbox.addEventListener("change", toggleTheme);
addDeckButton.addEventListener("click", addDeck);
deckSelector.addEventListener("change", (event) => {
  currentDeckIndex = parseInt(event.target.value, 10);
  localStorage.setItem("lastSelectedDeckIndex", currentDeckIndex);
  updateDisplay();
});
winButton.addEventListener("click", () => {
  if (currentDeckIndex > -1 && decks[currentDeckIndex]) {
    decks[currentDeckIndex].wins++;
    updateDisplay();
    saveDecks();
  }
});
lossButton.addEventListener("click", () => {
  if (currentDeckIndex > -1 && decks[currentDeckIndex]) {
    decks[currentDeckIndex].losses++;
    updateDisplay();
    saveDecks();
  }
});
resetButton.addEventListener("click", () => {
  if (currentDeckIndex > -1 && decks[currentDeckIndex]) {
    if (
      confirm(
        `Are you sure you want to reset stats for "${decks[currentDeckIndex].name}"?`
      )
    ) {
      decks[currentDeckIndex].wins = 0;
      decks[currentDeckIndex].losses = 0;
      updateDisplay();
      saveDecks();
    }
  }
});
deleteDeckButton.addEventListener("click", deleteSelectedDeck);

// --- Chart Rendering Functions ---
function renderDecksPieChart() {
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }
  const pieContainer = pieChartCanvas.parentElement;
  const decksWithGames = decks.filter((deck) => deck.wins + deck.losses > 0);

  if (decksWithGames.length === 0) {
    pieContainer.style.display = "none";
    return;
  }
  pieContainer.style.display = "block";

  const labels = decksWithGames.map((deck) => deck.name);
  const data = decksWithGames.map((deck) => deck.wins + deck.losses);
  const currentTheme = document.body.classList.contains("dark-mode")
    ? "dark"
    : "light";
  const chartColors = (
    currentTheme === "dark" ? darkModeColors : lightModeColors
  ).slice(0, data.length);
  const legendColor = getComputedStyle(document.body)
    .getPropertyValue("--chart-legend-text")
    .trim();
  const titleColor = getComputedStyle(document.body)
    .getPropertyValue("--chart-title-text")
    .trim();
  const pieBorderColor = getComputedStyle(document.body)
    .getPropertyValue("--container-bg")
    .trim();

  const displayLegend = labels.length <= 7; // Slightly more aggressive threshold

  pieChartInstance = new Chart(pieChartCanvas, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Games Played",
          data: data,
          backgroundColor: chartColors,
          borderColor: pieBorderColor,
          borderWidth: 1.5, // Slightly thinner border
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: {
        padding: {
          // Adjust padding based on whether legend is shown.
          // These values are more generous to force the pie to be smaller.
          top: displayLegend ? 10 : 30,
          right: 30,
          bottom: 30,
          left: 30,
        },
      },
      plugins: {
        legend: {
          display: displayLegend,
          position: "top",
          labels: {
            color: legendColor,
            boxWidth: 10,
            padding: 4,
            font: {
              size: 9,
            },
          },
          align: "center",
        },
        title: {
          display: true,
          text: "Deck Usage (Total Games)",
          color: titleColor,
          font: { size: 12 },
          padding: { top: 5, bottom: displayLegend ? 5 : 20 },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed !== null) {
                label += context.parsed + " games";
              }
              return label;
            },
          },
        },
      },
    },
  });
}

function renderWinratePerformanceChart() {
  if (performanceChartInstance) {
    performanceChartInstance.destroy();
  }
  const performanceContainer = performanceChartCanvas.parentElement;
  const performanceData = decks
    .map((deck) => {
      const totalMatches = deck.wins + deck.losses;
      const winrate = totalMatches > 0 ? (deck.wins / totalMatches) * 100 : 0;
      return { name: deck.name, winrate, totalMatches };
    })
    .filter((deck) => deck.totalMatches > 0)
    .sort((a, b) => b.winrate - a.winrate);

  if (performanceData.length === 0) {
    performanceContainer.style.display = "none";
    performanceContainer.style.height = "auto";
    return;
  }
  performanceContainer.style.display = "block";

  const barHeight = 35;
  const chartPaddingTop = 30;
  const chartPaddingBottom = 50;
  const calculatedHeight =
    performanceData.length * barHeight + chartPaddingTop + chartPaddingBottom;

  const minChartHeight = 180;
  const maxCalculatedContainerHeight =
    20 * barHeight + chartPaddingTop + chartPaddingBottom;

  if (
    calculatedHeight > maxCalculatedContainerHeight &&
    performanceData.length > 5
  ) {
    performanceContainer.style.height = `${maxCalculatedContainerHeight}px`;
    performanceContainer.style.overflowY = "auto";
  } else {
    performanceContainer.style.height = `${Math.max(
      minChartHeight,
      calculatedHeight
    )}px`;
    performanceContainer.style.overflowY = "hidden";
  }

  const labels = performanceData.map((d) => d.name);
  const winrateValues = performanceData.map((d) => d.winrate);
  const totalMatchesValues = performanceData.map((d) => d.totalMatches);
  const currentTheme = document.body.classList.contains("dark-mode")
    ? "dark"
    : "light";
  const baseBarColors =
    currentTheme === "dark" ? barChartColorsDark : barChartColorsLight;
  const chartBarColors = performanceData.map(
    (_, i) => baseBarColors[i % baseBarColors.length]
  );
  const textColor = getComputedStyle(document.body)
    .getPropertyValue("--text-color")
    .trim();
  const gridColor = getComputedStyle(document.body)
    .getPropertyValue("--chart-grid-line-color")
    .trim();
  const axisLabelColor = getComputedStyle(document.body)
    .getPropertyValue("--chart-axis-label-color")
    .trim();
  const barBorderColorCSS = getComputedStyle(document.body)
    .getPropertyValue("--bar-chart-border-color")
    .trim();

  performanceChartInstance = new Chart(performanceChartCanvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Winrate (%)",
          data: winrateValues,
          backgroundColor: chartBarColors,
          borderColor: barBorderColorCSS,
          borderWidth: 1,
          metaData: totalMatchesValues,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 5,
          right: 20,
          bottom: 5,
          left: 10,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Winrate (%)",
            color: textColor,
            font: { size: 12 },
            padding: { top: 10, bottom: 0 },
          },
          ticks: {
            color: axisLabelColor,
            callback: function (value) {
              return value + "%";
            },
          },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: axisLabelColor },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Deck Winrate (Sorted)",
          color: textColor,
          font: { size: 14 },
          padding: { top: 0, bottom: 10 },
        },
        tooltip: {
          /* ... (same as before) ... */
        },
      },
    },
  });
}

// --- Initial Load ---
loadTheme();
loadDecks();
