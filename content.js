(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    storageKey: "classHighlighterEnabled",
    tableSelector: "#mainContent_grdClasses",
    updateInterval: 60 * 1000, // 1 minute
    dayNames: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
    colors: {
      upcoming: { text: "#b71c1c", bg: "#ffcdd2" },
      ongoing: { text: "#1b5e20", bg: "#c8e6c9" },
      ended: { text: "#e65100", bg: "#ffe0b2" },
      banner: {
        upcoming: { text: "#856404", bg: "#fff3cd", border: "#856404" },
        none: { text: "#155724", bg: "#d4edda", border: "#155724" },
      },
    },
  };

  // State management
  const state = {
    enabled: localStorage.getItem(CONFIG.storageKey) !== "false",
    timer: null,
    elements: {
      table: null,
      toggleBtn: null,
      summaryBanner: null,
      rows: [],
    },
  };

  // Utility functions
  const utils = {
    formatDuration(ms) {
      const totalMinutes = Math.abs(Math.floor(ms / 60000));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    },

    parseTime(timeStr) {
      const [hours, minutes] = timeStr.trim().split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return null;
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    },

    getTodayName() {
      return CONFIG.dayNames[new Date().getDay()];
    },

    classHasToday(daysText, todayName) {
      return daysText.toLowerCase().includes(todayName);
    },
  };

  // UI creation functions
  const ui = {
    createToggleButton() {
      const btn = document.createElement("button");
      btn.id = "class-toggle-btn";
      btn.type = "button";
      btn.style.cssText = `
        margin: 10px 10px 0 10px;
        padding: 8px 16px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;
      btn.onmouseenter = () => (btn.style.transform = "translateY(-1px)");
      btn.onmouseleave = () => (btn.style.transform = "translateY(0)");
      return btn;
    },

    createSummaryBanner() {
      const banner = document.createElement("div");
      banner.id = "class-summary-banner";
      banner.className = "class-highlighter-added";
      banner.style.cssText = `
        padding: 14px;
        margin: 12px 10px;
        border: 2px solid;
        border-radius: 8px;
        font-weight: 600;
        font-size: 15px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
      `;
      return banner;
    },

    createStatusLabel(text, color) {
      const label = document.createElement("div");
      label.className = "class-status class-highlighter-added";
      label.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        color: ${color};
        margin-top: 4px;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        background: rgba(255,255,255,0.5);
      `;
      label.innerText = text;
      return label;
    },

    updateButtonState(enabled) {
      const btn = state.elements.toggleBtn;
      if (enabled) {
        btn.innerText = "⏸ Hide Highlights";
        btn.style.backgroundColor = "#007bff";
        btn.style.color = "#fff";
      } else {
        btn.innerText = "▶ Show Highlights";
        btn.style.backgroundColor = "#6c757d";
        btn.style.color = "#fff";
      }
    },
  };

  // Core logic
  const highlighter = {
    getClassStatus(startDate, endDate, now) {
      if (now < startDate) {
        return {
          type: "upcoming",
          text: `Starts in ${utils.formatDuration(startDate - now)}`,
          ...CONFIG.colors.upcoming,
        };
      } else if (now <= endDate) {
        return {
          type: "ongoing",
          text: `In Progress • ${utils.formatDuration(
            endDate - now
          )} remaining`,
          ...CONFIG.colors.ongoing,
        };
      } else {
        return {
          type: "ended",
          text: `Ended ${utils.formatDuration(now - endDate)} ago`,
          ...CONFIG.colors.ended,
        };
      }
    },

    processRow(row, todayName, now) {
      // Clear previous highlights
      row.style.backgroundColor = "";
      row.classList.remove("class-highlighter-highlight");
      row.querySelectorAll(".class-status").forEach((el) => el.remove());

      const cells = row.cells;
      if (!cells || cells.length < 9) return null;

      const daysText = cells[6].innerText;
      if (!utils.classHasToday(daysText, todayName)) return null;

      const startDate = utils.parseTime(cells[7].innerText);
      const endDate = utils.parseTime(cells[8].innerText);

      if (!startDate || !endDate) return null;

      const status = this.getClassStatus(startDate, endDate, now);

      // Apply styling
      row.style.backgroundColor = status.bg;
      row.style.transition = "background-color 0.3s ease";

      // Add status label
      const statusLabel = ui.createStatusLabel(status.text, status.text);
      cells[2].appendChild(statusLabel);

      // Return info if upcoming
      if (status.type === "upcoming") {
        return {
          row,
          startDate,
          course: cells[2].innerText.split("\n")[0].trim(),
          location: cells[5].innerText.trim(),
        };
      }

      return null;
    },

    updateAll() {
      if (!state.enabled) return;

      const now = new Date();
      const todayName = utils.getTodayName();
      let upcomingClasses = [];

      state.elements.rows.forEach((row) => {
        const upcoming = this.processRow(row, todayName, now);
        if (upcoming) upcomingClasses.push(upcoming);
      });

      // Sort by start time
      upcomingClasses.sort((a, b) => a.startDate - b.startDate);
      this.updateBanner(upcomingClasses[0]);
    },

    updateBanner(nextClass) {
      const banner = state.elements.summaryBanner;
      if (!banner) return;

      if (nextClass) {
        const timeUntil = utils.formatDuration(
          nextClass.startDate - new Date()
        );
        banner.innerHTML = `
          <span style="font-size: 18px;">📌</span> 
          <strong>Next:</strong> ${nextClass.course} 
          <span style="opacity: 0.8;">in ${timeUntil}</span>
          ${
            nextClass.location
              ? ` • <span style="opacity: 0.7;">${nextClass.location}</span>`
              : ""
          }
        `;
        Object.assign(banner.style, {
          backgroundColor: CONFIG.colors.banner.upcoming.bg,
          color: CONFIG.colors.banner.upcoming.text,
          borderColor: CONFIG.colors.banner.upcoming.border,
        });
      } else {
        banner.innerHTML =
          '<span style="font-size: 18px;">✅</span> <strong>All done for today!</strong>';
        Object.assign(banner.style, {
          backgroundColor: CONFIG.colors.banner.none.bg,
          color: CONFIG.colors.banner.none.text,
          borderColor: CONFIG.colors.banner.none.border,
        });
      }
    },

    clear() {
      document.querySelectorAll(".class-highlighter-added").forEach((el) => {
        if (el.id !== "class-toggle-btn") el.remove();
      });
      state.elements.rows.forEach((row) => {
        row.style.backgroundColor = "";
        row.classList.remove("class-highlighter-highlight");
      });
    },
  };

  // State controller
  const controller = {
    setEnabled(enabled) {
      state.enabled = enabled;
      localStorage.setItem(CONFIG.storageKey, String(enabled));

      // Clear existing timer
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }

      if (enabled) {
        ui.updateButtonState(true);

        // Re-add banner if needed
        if (!document.body.contains(state.elements.summaryBanner)) {
          state.elements.table.parentNode.insertBefore(
            state.elements.summaryBanner,
            state.elements.table
          );
        }

        highlighter.updateAll();
        state.timer = setInterval(
          () => highlighter.updateAll(),
          CONFIG.updateInterval
        );
      } else {
        ui.updateButtonState(false);
        highlighter.clear();

        if (
          state.elements.summaryBanner &&
          document.body.contains(state.elements.summaryBanner)
        ) {
          state.elements.summaryBanner.remove();
        }
      }
    },

    toggle() {
      this.setEnabled(!state.enabled);
    },
  };

  // Initialization
  function init() {
    // Find table
    const table = document.querySelector(CONFIG.tableSelector);
    if (!table) {
      console.error("Class table not found");
      return;
    }

    state.elements.table = table;
    state.elements.rows = Array.from(table.querySelectorAll("tbody tr")).slice(
      1
    );

    if (state.elements.rows.length === 0) {
      console.warn("No class rows found");
      return;
    }

    // Create or find UI elements
    state.elements.toggleBtn =
      document.querySelector("#class-toggle-btn") || ui.createToggleButton();
    state.elements.summaryBanner =
      document.querySelector("#class-summary-banner") ||
      ui.createSummaryBanner();

    // Insert elements if new
    if (!document.body.contains(state.elements.toggleBtn)) {
      table.parentNode.insertBefore(state.elements.toggleBtn, table);
    }

    // Attach event handler
    state.elements.toggleBtn.onclick = () => controller.toggle();

    // Start
    controller.setEnabled(state.enabled);

    console.log("Class Highlighter initialized successfully");
  }

  // Run initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
