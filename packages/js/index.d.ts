export declare const VERSION: string;
export declare const DEFAULT_BASE_URL: string;

export interface Rate {
  code: string;
  name: string;
  name_en: string;
  symbol: string;
  /** How many units the price is for (Iraqi dinar: 100). */
  unit: number;
  per_usd: number;
  is_pegged: boolean;
  buy: number;
  sell: number;
  [field: string]: unknown;
}

export interface Envelope<T> {
  data: T;
  meta: { as_of: string; plan: string; [field: string]: unknown };
}

export interface Conversion {
  from: string;
  to: string;
  amount: number;
  side: "mid" | "buy" | "sell";
  rate: number;
  result: number;
}

export declare class NetArzFxError extends Error {
  status: number;
  code?: string;
  docs?: string;
  seenIp?: string;
}

export interface ClientOptions {
  key?: string;
  baseUrl?: string;
  /** Seconds a GET answer is reused (default 120, 0 = off). */
  ttl?: number;
  fetch?: typeof fetch;
}

type Params = Record<string, string | number | undefined>;

export interface NetArzFx {
  request(method: string, path: string, params?: Params, body?: unknown): Promise<any>;
  rates(codes?: string[]): Promise<Envelope<Rate[]>>;
  rate(code: string): Promise<Rate>;
  currencies(): Promise<any>;
  convert(from: string, to: string, amount?: number, side?: "mid" | "buy" | "sell"): Promise<Conversion>;
  history(code: string, params?: Params): Promise<any>;
  archive(code: string, params?: Params): Promise<any>;
  ohlc(code: string, params?: Params): Promise<any>;
  stats(code: string, params?: Params): Promise<any>;
  snapshot(code: string, at: string): Promise<any>;
  status(): Promise<any>;
  me(): Promise<any>;
}

export declare function createClient(options?: ClientOptions): NetArzFx;
export default createClient;
