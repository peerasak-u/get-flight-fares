const axios = require('axios');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const FlightFare = require('./FlightFare');

dayjs.extend(customParseFormat);

class Airline {
  constructor(name) {
    this.name = name;
    this.fares = [];
  }

  getFares(departure, destination) {
    console.log(`- Getting flight from ${this.name}`);
  }
}

class Red extends Airline {
  getFares(departure, destination) {
    super.getFares(departure, destination);
    return new Promise(async (resolve, reject) => {
      const fromDate = dayjs().startOf('month').format('YYYY-MM-DD');
      const mainUrl =
        'https://k.airasia.com/availabledates/api/v1/pricecalendar';
      const url = `${mainUrl}/0/0/THB/${departure}/${destination}/${fromDate}/1/16`;
      try {
        const res = await axios.get(url);
        const dataKey = `${departure}${destination}|THB`;
        const data = res.data;
        const result = Object.keys(data[dataKey]).map((key) => {
          const keyDate = dayjs(key, 'YYYY-MM-DD');
          const date = keyDate.format('DD/MM/YYYY');
          const day = keyDate.format('ddd');
          const fare = data[dataKey][key];
          return new FlightFare(date, day, fare, 'RED');
        });
        this.fares = result;
        resolve(result);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}

class Yellow extends Airline {
  getFares(departure, destination) {
    super.getFares(departure, destination);
    return new Promise(async (resolve, reject) => {
      const fromDate = dayjs().startOf('month').format('MM/DD/YYYY');
      const toDate = dayjs().add(1, 'year').format('MM/DD/YYYY');
      const mainUrl = 'https://www.nokair.com/Flight/GetCalendarFare';
      const url = `${mainUrl}?from=${departure}&to=${destination}&fromDate=${fromDate}&toDate=${toDate}&currency=THB`;
      try {
        const res = await axios.get(url);
        const result = res.data.map((item) => {
          const itemDate = dayjs(item.dateKey, 'YYYYMMDD');
          const date = itemDate.format('DD/MM/YYYY');
          const day = itemDate.format('ddd');
          const fare = parseFloat(item.amount.replace(',', ''));
          return new FlightFare(date, day, fare, 'YELLOW');
        });
        this.fares = result;
        resolve(result);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}

module.exports = { Red, Yellow };
