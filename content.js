(function () {
  const STORAGE_KEY = "classHighlighterEnabled";

  const table = document.querySelector("#mainContent_grdClasses");
  if (!table) {
    console.error("Table not found");
    return;
  }

  const rows = Array.from(table.querySelectorAll("tbody tr")).slice(1); // skip header
  const today = new Date();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayName = dayNames[today.getDay()];

  // Insert toggle button
  let toggleBtn = document.querySelector("#class-toggle-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.id = "class-toggle-btn";
    toggleBtn.type = "button";
    toggleBtn.innerText = "⏸ Hide Class Highlights";
    toggleBtn.style.margin = "10px";
    toggleBtn.style.padding = "6px 12px";
    toggleBtn.style.fontWeight = "bold";
    toggleBtn.style.border = "1px solid #333";
    toggleBtn.style.borderRadius = "6px";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.backgroundColor = "#007bff";
    toggleBtn.style.color = "#fff";
    table.parentNode.insertBefore(toggleBtn, table);
  }

  // Insert summary banner
  let summaryBanner = document.querySelector("#class-summary-banner");
  if (!summaryBanner) {
    summaryBanner = document.createElement("div");
    summaryBanner.id = "class-summary-banner";
    summaryBanner.className = "class-highlighter-added";
    summaryBanner.style.padding = "12px";
    summaryBanner.style.margin = "12px 0";
    summaryBanner.style.border = "2px solid #333";
    summaryBanner.style.borderRadius = "8px";
    summaryBanner.style.fontWeight = "bold";
    summaryBanner.style.fontSize = "16px";
    summaryBanner.style.backgroundColor = "#f8f9fa";
    summaryBanner.style.color = "#000";
    table.parentNode.insertBefore(summaryBanner, table);
  }

  let enabled = localStorage.getItem(STORAGE_KEY) !== "false"; // default = true
  let timer = null;

  function formatDuration(ms) {
    const totalMinutes = Math.abs(Math.floor(ms / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  }

  function updateHighlights() {
    if (!enabled) return;

    let upcomingClass = null;

    rows.forEach((row) => {
      row.style.backgroundColor = "";
      row.classList.remove("class-highlighter-highlight");
      row.querySelectorAll(".class-status").forEach((el) => el.remove());

      const daysText = row.cells[6].innerText.toLowerCase();
      if (daysText.includes(todayName)) {
        const startTime = row.cells[7].innerText.trim();
        const endTime = row.cells[8].innerText.trim();

        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);

        const startDate = new Date(today);
        startDate.setHours(sh, sm, 0, 0);

        const endDate = new Date(today);
        endDate.setHours(eh, em, 0, 0);

        const now = new Date();
        let text = "";
        let color = "";
        let bgColor = "";

        if (now < startDate) {
          text = `Starts in ${formatDuration(startDate - now)}`;
          color = "#b71c1c"; // deep red text
          bgColor = "#ffcdd2"; // light red background
          if (!upcomingClass || startDate < upcomingClass.startDate) {
            upcomingClass = { row, startDate, course: row.cells[2].innerText };
          }
        } else if (now >= startDate && now <= endDate) {
          text = `Ongoing (${formatDuration(endDate - now)} left)`;
          color = "#1b5e20"; // dark green text
          bgColor = "#c8e6c9"; // light green background
        } else {
          text = `Ended (${formatDuration(now - endDate)} ago)`;
          color = "#e65100"; // deep orange text
          bgColor = "#ffe0b2"; // light orange background
        }

        // Apply row highlight
        row.style.backgroundColor = bgColor;

        // Add inline status
        const status = document.createElement("div");
        status.className = "class-status class-highlighter-added";
        status.style.fontSize = "13px";
        status.style.fontWeight = "bold";
        status.style.color = color;
        status.innerText = text;
        row.cells[2].appendChild(status);
      }
    });

    // Update summary banner
    if (upcomingClass) {
      summaryBanner.innerText = `📌 Up Next: ${
        upcomingClass.course
      } (starts in ${formatDuration(upcomingClass.startDate - new Date())})`;
      summaryBanner.style.backgroundColor = "#fff3cd";
      summaryBanner.style.color = "#856404";
      summaryBanner.style.borderColor = "#856404";
    } else {
      summaryBanner.innerText = "✅ No more classes today";
      summaryBanner.style.backgroundColor = "#d4edda";
      summaryBanner.style.color = "#155724";
      summaryBanner.style.borderColor = "#155724";
    }
  }

  function clearHighlights() {
    document.querySelectorAll(".class-highlighter-added").forEach((el) => {
      if (el.id !== "class-summary-banner") el.remove();
    });
    rows.forEach((row) => {
      row.style.backgroundColor = "";
      row.classList.remove("class-highlighter-highlight");
    });
  }

  function setEnabled(state) {
    enabled = state;
    localStorage.setItem(STORAGE_KEY, state);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (enabled) {
      toggleBtn.innerText = "⏸ Hide Class Highlights";
      toggleBtn.style.backgroundColor = "#007bff";
      if (!document.body.contains(summaryBanner)) {
        table.parentNode.insertBefore(summaryBanner, table);
      }
      updateHighlights();
      timer = setInterval(updateHighlights, 60 * 1000);
    } else {
      toggleBtn.innerText = "▶ Show Class Highlights";
      toggleBtn.style.backgroundColor = "#6c757d";
      clearHighlights();
      if (summaryBanner && document.body.contains(summaryBanner)) {
        summaryBanner.remove();
      }
    }
  }

  toggleBtn.onclick = () => setEnabled(!enabled);

  // Initial run
  setEnabled(enabled);
})();
