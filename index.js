const fs = require('fs');
const util = require('util');

const { Red, Yellow } = require('./models/Airline');

const getFares = async () => {
  const departure = 'CNX';
  const destination = 'DMK';
  const redAirline = new Red('AirRed');
  const yellowAirline = new Yellow('YellowBird');

  try {
    const getFarePromise = [redAirline, yellowAirline].map((airline) =>
      airline.getFares(departure, destination),
    );
    const fares = await Promise.all(getFarePromise);
    const results = fares.flat();
    const filtered = results.filter((fare) => fare.isCheaperThan(1000, 2));
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('results.json', JSON.stringify(filtered));
    console.log(`Saved ${filtered.length} flights to results.json`);
  } catch (error) {
    console.error(error);
  }
};

getFares();
