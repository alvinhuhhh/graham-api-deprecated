declare type BasicData = {
  name: string;
  price: number;
  currency: string;
  marketCap: number;
  priceToBook: number;
};

declare type FinancialData = {
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
};

declare type EPSData = {
  [yearMinus0: string]: number;
  [yearMinus1: string]: number;
  [yearMinus2: string]: number;
  [yearMinus3: string]: number;
  [yearMinus4: string]: number;
  [yearMinus5: string]: number;
  [yearMinus6: string]: number;
  [yearMinus7: string]: number;
  [yearMinus8: string]: number;
  [yearMinus9: string]: number;
  [yearMinus10: string]: number;
};

declare type CriteriaData = {
  order: number;
  description: string;
  met: boolean;
  value: number;
  valueLabel: string;
};

declare type CriteriaResponse = {
  name: string;
  ticker: string;
  price: number;
  currency: string;
  criteria: CriteriaData[];
};
