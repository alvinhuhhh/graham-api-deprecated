import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";

import {
  calculateMarketCap,
  calculateCurrentRatio,
  calculateEarningsGrowth,
  calculatePeRatio,
  calculatePbRatio,
} from "./util.js";

import {
  getDataFromYF,
  getFinancialDataFromNASDAQ,
  getEPSFromNASDAQ,
} from "./service.js";

const app = express();
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

app.get("/ping", (req: Request, res: Response) => {
  res.send("ping");
});

app.get("/api/criteria", async (req: Request, res: Response) => {
  // Validate ticker
  if (!req.query.ticker) {
    return res.status(400).send("Ticker symbol request parameter required");
  }
  const ticker: string = req.query.ticker as string;
  const tickerUpperCase = ticker.toUpperCase();

  const getDataFromYFPromise = getDataFromYF(tickerUpperCase);
  const getFinancialDataFromNASDAQPromise =
    getFinancialDataFromNASDAQ(tickerUpperCase);
  const getEPSFromNASDAQPromise = getEPSFromNASDAQ(tickerUpperCase);

  let criteria1 = false;
  let criteria2 = false;
  let criteria3 = false;
  let criteria4 = false;
  let criteria5 = false;

  Promise.all([
    getDataFromYFPromise,
    getFinancialDataFromNASDAQPromise,
    getEPSFromNASDAQPromise,
  ])
    .then(([basicData, financialData, epsData]) => {
      if (basicData && financialData && epsData) {
        const marketCap = calculateMarketCap(basicData);
        if (marketCap) criteria1 = marketCap > 10000000000;

        const currentRatio = calculateCurrentRatio(financialData);
        if (currentRatio) criteria2 = currentRatio >= 2;

        const earningsGrowth = calculateEarningsGrowth(epsData);
        if (earningsGrowth) criteria3 = earningsGrowth > 0.33;

        const peRatio = calculatePeRatio(basicData, epsData);
        if (peRatio) criteria4 = peRatio > -1 && peRatio < 25;

        const pbRatio = calculatePbRatio(basicData);
        if (pbRatio) criteria5 = pbRatio < 3;

        const body: CriteriaResponse = {
          name: basicData.name,
          ticker: tickerUpperCase,
          price: basicData.price,
          currency: basicData.currency,
          criteria: [
            {
              order: 1,
              description: "Total market cap more than $100 billion",
              met: criteria1,
              value: marketCap,
              valueLabel: "Market Cap",
            },
            {
              order: 2,
              description: "Current assets twice current liabilities",
              met: criteria2,
              value: currentRatio,
              valueLabel: "Current Ratio",
            },
            {
              order: 3,
              description:
                "Earnings growth above 33% over the past 10 years, taking 3-year averages",
              met: criteria3,
              value: earningsGrowth,
              valueLabel: "Earnings Growth",
            },
            {
              order: 4,
              description:
                "Current price not more than 25 times average earnings of the past 4 years",
              met: criteria4,
              value: peRatio,
              valueLabel: "P/E Ratio",
            },
            {
              order: 5,
              description:
                "Current price not more than 3.0 times the book value",
              met: criteria5,
              value: pbRatio,
              valueLabel: "P/B Ratio",
            },
          ],
        };

        return res.status(200).send(body);
      } else {
        throw new Error("Unable to fetch data");
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).send(err.message);
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`graham-api server started on port ${PORT}`);
});
