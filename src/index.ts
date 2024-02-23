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
        if (peRatio) criteria4 = peRatio < 25;

        const pbRatio = calculatePbRatio(basicData);
        if (pbRatio) criteria5 = pbRatio < 3;

        return res.status(200).send({
          ticker: tickerUpperCase,
          criteria1: {
            description: "Total market cap must be more than $100 billion",
            met: criteria1,
            marketCap: marketCap,
          },
          criteria2: {
            description: "Current assets should be twice current liabilities",
            met: criteria2,
            currentRatio: currentRatio,
          },
          criteria3: {
            description:
              "Earnings growth should be 33% over the past 10 years, taking 3-year averages",
            met: criteria3,
            earningsGrowth: earningsGrowth,
          },
          criteria4: {
            description:
              "Current price should not be more than 25 times average earnings of the past 4 years",
            met: criteria4,
            peRatio: peRatio,
          },
          criteria5: {
            description:
              "Current price should not be more than 3.0 times the book value",
            met: criteria5,
            pbRatio: pbRatio,
          },
        });
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
