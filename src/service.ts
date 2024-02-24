import axios, { AxiosError, AxiosResponse } from "axios";
import yahooFinance from "yahoo-finance2";

const http = axios.create({
  headers: {
    "User-Agent": "PostmanRuntime/7.36.1",
  },
});

function convertCurrencyStringToFloat(str: string): number {
  let tmp = str.replace(/[^0-9.-]+/g, "");
  return parseFloat(tmp);
}

export async function getDataFromYF(ticker: string): Promise<BasicData | null> {
  try {
    const { longName, regularMarketPrice, marketCap } =
      await yahooFinance.quote(ticker);
    const { defaultKeyStatistics } = await yahooFinance.quoteSummary(ticker, {
      modules: ["defaultKeyStatistics"],
    });

    console.log(`[getDataFromYF] Returned status code: 200`);

    if (
      !longName ||
      !regularMarketPrice ||
      !marketCap ||
      !defaultKeyStatistics?.priceToBook
    ) {
      throw new Error("Unable to fetch basic data from Yahoo Finance");
    }

    return {
      name: longName,
      price: regularMarketPrice,
      marketCap: marketCap,
      priceToBook: defaultKeyStatistics.priceToBook,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getFinancialDataFromNASDAQ(
  ticker: string
): Promise<FinancialData | null> {
  const url = `https://api.nasdaq.com/api/company/${ticker}/financials?frequency=1`;

  let result: FinancialData | null = null;
  await http
    .get(url)
    .then((res: AxiosResponse) => {
      console.log(
        `[getFinancialDataFromNASDAQ] Returned status code: ${res.status}`
      );

      const data = res.data["data"];
      const { rows } = data.balanceSheetTable;

      const totalCurrentAssets = rows.find(
        (row: any) => row["value1"] == "Total Current Assets"
      );
      const totalCurrentLiabilities = rows.find(
        (row: any) => row["value1"] == "Total Current Liabilities"
      );

      result = {
        totalCurrentAssets: convertCurrencyStringToFloat(
          totalCurrentAssets["value2"]
        ),
        totalCurrentLiabilities: convertCurrencyStringToFloat(
          totalCurrentLiabilities["value2"]
        ),
      };
    })
    .catch((err: AxiosError) => {
      console.log(err);
    });

  return result;
}

export async function getEPSFromNASDAQ(
  ticker: string
): Promise<EPSData | null> {
  let result: EPSData = {
    yearMinus0: -1,
    yearMinus1: -1,
    yearMinus2: -1,
    yearMinus3: -1,
    yearMinus4: -1,
    yearMinus5: -1,
    yearMinus6: -1,
    yearMinus7: -1,
    yearMinus8: -1,
    yearMinus9: -1,
    yearMinus10: -1,
  };

  let year = 0;
  for (let i = 1; i < 5; i++) {
    // const { data } = require(`./tests/NASDAQRevenueLimit${i}Response.json`);
    const url = `https://api.nasdaq.com/api/company/${ticker}/revenue?limit=${i}`;

    let data;
    await http
      .get(url)
      .then((res: AxiosResponse) => {
        console.log(`[getEPSFromNASDAQ] Returned status code: ${res.status}`);
        data = res.data["data"];

        if (!data?.revenueTable) {
          return null;
        }

        const { rows } = data.revenueTable;
        const eps = rows[rows.length - 2];

        result[`yearMinus${year}`] = convertCurrencyStringToFloat(
          eps["value2"]
        );
        year++;
        result[`yearMinus${year}`] = convertCurrencyStringToFloat(
          eps["value3"]
        );
        year++;
        result[`yearMinus${year}`] = convertCurrencyStringToFloat(
          eps["value4"]
        );
        year++;
      })
      .catch((err: AxiosError) => {
        console.error(err);
        return null;
      });
  }

  return result;
}
