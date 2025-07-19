const fs = require('fs');
const path = require('path');

const currentDirectory = process.cwd();
const app = {};
const fileData = {};
const configFile = '_app3Config.json';
const filterDate = "2025-1-1"; 
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

// ------------------ EXISTING FUNCTIONS (UNCHANGED) ------------------
function getWeekNumber(date) {
  const date2 = new Date(date);
  date2.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  return Math.ceil(((date2 - new Date(date2.getFullYear(), 0, 4)) / 86400000 + 1) / 7) + 1;
}

function convertHEX(RCV_BYTES) {
  let _HEXStr = RCV_BYTES[0] + RCV_BYTES[1];
  let _HEXInt = parseInt(_HEXStr,16) * 0.01;
  return _HEXInt.toFixed(0);
}

// ------------------ MODIFIED READFILE FUNCTION ------------------
function readFile(config) {
  const _filePath = config.filePath;
  const _filterDate = new Date(filterDate);
  const PowerMeterName = config.PowerMeterName;

  fs.readFile(_filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    let energyKWhByWeek = {};
    let energyKWhByMonth = {};
    const lines = data.trim().split('\n');

    const fileDataObjects = lines.map((line) => {
      try {
        let JSONObject = JSON.parse(line)
        let dateTime = new Date(JSONObject.TIMESTAMP);
        return JSONObject;
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
      }
    }).filter(logEntry => logEntry && new Date(logEntry.TIMESTAMP) >= new Date(_filterDate));

    // ------------------ NEW: Track weekday/weekend data ------------------
    let weekdayWeekendData = {};
    
    fileDataObjects.forEach((logEntry) => {
      let date = new Date(logEntry.TIMESTAMP);
      let weekNumber = getWeekNumber(date);
      let energyKWh = convertHEX(logEntry.RCV_BYTES);
      let month = date.toISOString().substring(0, 7);
      let dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      // Initialize week data structure if needed
      if (!weekdayWeekendData[weekNumber]) {
        weekdayWeekendData[weekNumber] = {
          weekday: { total: 0, count: 0 },
          weekend: { total: 0, count: 0 },
          date: date.toLocaleDateString()
        };
      }

      // Categorize as weekday or weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        weekdayWeekendData[weekNumber].weekend.total += parseFloat(energyKWh);
        weekdayWeekendData[weekNumber].weekend.count++;
      } else { // Weekday
        weekdayWeekendData[weekNumber].weekday.total += parseFloat(energyKWh);
        weekdayWeekendData[weekNumber].weekday.count++;
      }

      // Original week/month tracking (unchanged)
      if (!energyKWhByWeek[weekNumber]) {
        energyKWhByWeek[weekNumber] = { 
          date: date.toLocaleDateString(), 
          energyKWh: energyKWh 
        };
      } else {
        energyKWhByWeek[weekNumber].date = date.toLocaleDateString();
        energyKWhByWeek[weekNumber].energyKWh = energyKWh;
      }
      
      if (!energyKWhByMonth[month]) {
        energyKWhByMonth[month] = 0;
      }
      energyKWhByMonth[month] = energyKWh;
    });

    // Sort weeks (unchanged)
    let sortedWeeks = Object.keys(energyKWhByWeek).sort((a, b) => {
      let dateA = energyKWhByWeek[a].date;
      let dateB = energyKWhByWeek[b].date;
      let yearA = dateA.substring(0, 4);
      let yearB = dateB.substring(0, 4);
      let monthA = dateA.substring(5, 7);
      let monthB = dateB.substring(5, 7);
      let dayA = dateA.substring(8, 10);
      let dayB = dateB.substring(8, 10);
      if (yearA !== yearB) {
        return yearA - yearB;
      } else if (monthA !== monthB) {
        return monthA - monthB;
      } else {
        return dayA - dayB;
      }
    });

    // ------------------ MODIFIED EXPORT SECTION ------------------
    let exportData = '';
    const exportFile = '_app3Export.txt';
    let previousEnergyKWh = null;

    exportData += `\nPower Meter: ${PowerMeterName}\n`;
    exportData += `Filter Date: ${_filterDate.toLocaleDateString()}\n`;
    exportData += `File Path: ${_filePath}\n`;
    
    sortedWeeks.forEach((weekNumber) => {
      const weekData = weekdayWeekendData[weekNumber];
      const date = new Date(energyKWhByWeek[weekNumber].date);
      
      // Weekday entry (Mon-Fri)
      exportData += `Week ${weekNumber} (Mon-Fri): ${weekData.weekday.total.toFixed(0)} kWh\n`;
      
      // Weekend entry (Sat-Sun)
      exportData += `Week ${weekNumber} (Sat-Sun): ${weekData.weekend.total.toFixed(0)} kWh\n`;
      
      // Original total (unchanged)
      let energyKWh = energyKWhByWeek[weekNumber].energyKWh;
      let NETEnergyKWh = 0;
      if (previousEnergyKWh !== null) {
        NETEnergyKWh = energyKWh - previousEnergyKWh;
      }
      previousEnergyKWh = energyKWh;
    });

    // Monthly summary (unchanged)
    exportData += "SUMMARY BY MONTH:\n";
    previousEnergyKWh = 0;
    Object.keys(energyKWhByMonth).forEach((month) => {
      let energyKWh = energyKWhByMonth[month];
      if (previousEnergyKWh !== 0) {
        let netEnergyKWh = energyKWh - previousEnergyKWh;
        exportData += `${month}: ${energyKWh} kWh (Net: ${netEnergyKWh} kWh)\n`;
      } else {
        exportData += `${month}: ${energyKWh} kWh (Net: 0 kWh)\n`;
      }
      previousEnergyKWh = energyKWh;
    });

    fs.appendFileSync(exportFile, exportData);
    console.log(`EXPORT DATA FROM ${PowerMeterName} TO ${exportFile}`);
  });
};

// ----- UNCHANGED EXECUTION -----
config.forEach((configItem) => {
  readFile(configItem);
});

module.exports = app;