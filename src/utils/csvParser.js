export function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);

  const headers = lines[0].split(';');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(';');

    if (values.length < headers.length || !values[0].trim()) continue;

    const entry = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim();
      if (header) {
        let value = values[j];
        if (value && !isNaN(value.replace(',', '.'))) {
          value = parseFloat(value.replace(',', '.'));
        }
        entry[header] = value;
      }
    }
    data.push(entry);
  }

  return data;
}
