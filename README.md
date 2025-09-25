# UEAB iCampus Class Highlights Chrome Extension

This Chrome extension enhances the class schedule page on iCampus (https://icampus.ueab.ac.ke/iStudent/Auth/Classes/TimeTa*) by highlighting classes based on their status relative to the current time. It provides visual cues for upcoming, ongoing, and ended classes, along with a summary banner and a toggle button to enable/disable the highlights.

## Features

- **Class Highlighting**: Rows are colored based on class status:
  - Upcoming classes: Light red background with red text indicating time until start.
  - Ongoing classes: Light green background with green text showing time remaining.
  - Ended classes: Light orange background with orange text showing time since end.
- **Summary Banner**: Displays the next upcoming class or confirms no more classes for the day.
- **Toggle Button**: Allows users to show or hide highlights, with state saved in localStorage.
- **Auto-Update**: Highlights update every minute when enabled.

## Installation

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click the "Load unpacked" button.
5. Select the folder containing the extension files (`manifest.json` and `content.js`).
6. The extension will be loaded and active on the specified URL.

## Usage

- Visit the class schedule page on iCampus.
- The extension will automatically inject the toggle button and summary banner above the class table.
- Click the toggle button to enable or disable highlights.
- Highlights will update automatically every minute when enabled.

## Files

- `manifest.json`: Defines the extension's metadata and content script injection.
- `content.js`: Contains the main logic for highlighting and updating the page.

## Permissions

No additional permissions are needed.

## Notes

- The extension only runs on the specified URL pattern.
- Class data is parsed from the existing table structure;
- If the table is not found, an error is logged to the console.
