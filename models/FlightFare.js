const dayjs = require('dayjs');

class FlightFare {
  constructor(date, day, fare, brand) {
    this.date = date;
    this.day = day;
    this.fare = fare;
    this.brand = brand;
  }

  isCheaperThan(minimumPrice, numberOfMonths) {
    const monthToGo = dayjs().add(numberOfMonths, 'month').startOf('month');
    return (
      dayjs(this.date, 'DD/MM/YYYY').isBefore(monthToGo, 'date') &&
      this.fare < minimumPrice
    );
  }
}

module.exports = FlightFare;
