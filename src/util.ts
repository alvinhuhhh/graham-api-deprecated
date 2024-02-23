export function calculateMarketCap(basicData: BasicData) {
  return basicData["marketCap"];
}

export function calculateCurrentRatio(financialData: FinancialData) {
  return (
    financialData["totalCurrentAssets"] /
    financialData["totalCurrentLiabilities"]
  );
}

export function calculateEarningsGrowth(epsData: EPSData) {
  const currentEPSAverage =
    (epsData["yearMinus0"] + epsData["yearMinus1"] + epsData["yearMinus2"]) / 3;
  const year10EPSAverage =
    (epsData["yearMinus8"] + epsData["yearMinus9"] + epsData["yearMinus10"]) /
    3;
  const earningsGrowth =
    (currentEPSAverage - year10EPSAverage) / year10EPSAverage;

  return earningsGrowth;
}

export function calculatePeRatio(basicData: BasicData, epsData: EPSData) {
  const price = basicData["price"];
  const eps4YearAverage =
    (epsData["yearMinus1"] +
      epsData["yearMinus2"] +
      epsData["yearMinus3"] +
      epsData["yearMinus4"]) /
    4;
  const peRatio = price / eps4YearAverage;
  return peRatio;
}

export function calculatePbRatio(basicData: BasicData) {
  return basicData["priceToBook"];
}
