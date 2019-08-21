const puppeteer = require('puppeteer');
const axios = require('axios');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const fs = require('fs');
const util = require('util');
dayjs.extend(customParseFormat);

const departure = 'SNO';
const destination = 'DMK';

const getRedAirlineFares = () => {
    return new Promise(async (resolve, reject) => {
        console.log('- Get flight from Red Airline');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const mainUri = 'https://www.airasia.com/th/th';
        const departSelector = 'input[aria-controls="home-origin-autocomplete-heatmapstation-combobox"]';

        try {
            console.log('go to page');
            await page.goto(mainUri);
            console.log('waiting for input field');
            await page.waitForSelector(departSelector);
            console.log('click on input field');
            await page.click(departSelector);

            console.log('input departure airport');
            await page.keyboard.type(departure);
            await page.waitForSelector('li[id="home-origin-autocomplete-heatmaplist-0"]');
            await page.keyboard.press('Enter');
            await page.waitFor(1000);

            console.log('input destination airport');
            await page.keyboard.type(destination);
            await page.waitForSelector('li[id="home-destination-autocomplete-heatmaplist-0"]');
            await page.waitFor(1000);
            await page.keyboard.press('Enter');
        } catch (error) {
            browser.close();
            console.error(error);
            resolve([]);
        }

        page.on('response', async (response) => {
            const pattern = /pricecalendar\/\d\/\d\/THB\/\w{3}\/\w{3}\/\d{4}-\d{2}-\d{2}\/1\/\d+/;

            if (pattern.test(response.url())) {
                console.log('detected', response.url());
                const data = await response.json();
                try {
                    const dataKey = `${departure}${destination}|THB`;
                    const result = Object.keys(data[dataKey]).map(key => {
                        const keyDate = dayjs(key, 'YYYY-MM-DD')
                        const date = keyDate.format('DD/MM/YYYY');
                        const day = keyDate.format('ddd');
                        const fare = data[dataKey][key];
                        return {
                            date, day, fare,
                            brand: 'RED'
                        };
                    });
                    browser.close();
                    resolve(result);
                } catch (error) {
                    console.error(error);
                    browser.close();
                    reject(error);
                }
            }
        });

    });
};

const getYellowAirlineFares = () => {
    return new Promise(async (resolve, reject) => {
        console.log('- Get flight from Yellow Airline');
        const fromDate = dayjs().startOf('month').format('MM/DD/YYYY');
        const toDate = dayjs().add(1, 'year').format('MM/DD/YYYY');
        const mainUrl = 'https://www.nokair.com/Flight/GetCalendarFare';
        const url = `${mainUrl}?from=${departure}&to=${destination}&fromDate=${fromDate}&toDate=${toDate}&currency=THB`;
        try {
            const res = await axios.get(url);
            const result = res.data.map(item => {
                const itemDate = dayjs(item.dateKey, 'YYYYMMDD');
                return {
                    date: itemDate.format('DD/MM/YYYY'),
                    day: itemDate.format('ddd'),
                    fare: parseFloat(item.amount.replace(',', '')),
                    brand: 'YELLOW'
                };
            })
            resolve(result);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};


const getFares = async () => {
    const red = await getRedAirlineFares();
    const yellow = await getYellowAirlineFares();
    const results = red.concat(yellow);
    const nextTwoMonth = dayjs().add(2, 'month').startOf('month');
    const filtered = results.filter(item => {
        return dayjs(item.date, 'DD/MM/YYYY').isBefore(nextTwoMonth, 'date') && item.fare < 1000
    })
    const writeFile = util.promisify(fs.writeFile);
    try {
        await writeFile('results.json', JSON.stringify(filtered));
        console.log(`founded ${filtered.length} in results.json`);
    } catch (error) {
        console.error(error);
    }
};

getFares();