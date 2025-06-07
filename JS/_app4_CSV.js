const fs = require('fs');
// 
// APPS TO CONVERT LOGS TO CSV
//
const logFile = '_CHEMCAL STORE B0-60-6C-8B-AD-78.log'; // replace with the actual file path
const csvFile = '_CHEMCAL STORE B0-60-6C-8B-AD-78.log.csv'; // output file name

fs.readFile(logFile, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data.length);

  const jsonData = data.split('\n').map(line => JSON.parse(line));
  const csvData = jsonData.map(item => ({
    modelID: item.modelID,
    modelType: item.modelType,
    Temperature: item.Temperature,
    Humidity: item.Humidity,
    TIMESTAMP: item.TIMESTAMP,
    BATT: item.BATT,
    INTERVAL: item.INTERVAL
  }));

  const csvHeader = 'modelID,modelType,Temperature,Humidity,TIMESTAMP,BATT,INTERVAL\n';
  const csvRows = csvData.map(item => `${item.modelID},${item.modelType},${item.Temperature},${item.Humidity},${item.TIMESTAMP},${item.BATT},${item.INTERVAL}\n`).join('');

  const csvContent = csvHeader + csvRows;

  fs.writeFile(csvFile, csvContent, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('CSV file written successfully!');
    }
  });
});