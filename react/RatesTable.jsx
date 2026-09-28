// <RatesTable />: a small right-to-left rate table built on useNetArzRates.
//
//   import RatesTable from "./RatesTable.jsx";
//   <RatesTable codes={["USD", "EUR", "AED", "TRY"]} endpoint="/api/fx-rates" />
//
// Unstyled on purpose: give it your own classes. Keep the source line visible.
import { useNetArzRates, formatToman } from "./useNetArzRates.js";

export default function RatesTable({ codes, endpoint, apiKey, className }) {
  const { rates, meta, error, loading } = useNetArzRates({ codes, endpoint, apiKey });

  if (loading && rates.length === 0) return <p className={className}>در حال دریافت نرخ‌ها…</p>;
  if (error && rates.length === 0) return <p className={className} role="alert">نرخ‌ها دریافت نشد ({error.code || error.message}).</p>;

  return (
    <figure className={className} dir="rtl">
      <table>
        <thead>
          <tr>
            <th scope="col">ارز</th>
            <th scope="col">خرید (تومان)</th>
            <th scope="col">فروش (تومان)</th>
            <th scope="col">تغییر ۲۴ ساعت</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r) => (
            <tr key={r.code}>
              <td>{r.name} <small>{r.code}</small></td>
              <td>{formatToman(r, "buy")}</td>
              <td>{formatToman(r, "sell")}</td>
              <td dir="ltr">{r.change_24h_percent == null ? "-" : `${r.change_24h_percent}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption>
        <small>
          {meta?.as_of && <time dateTime={meta.as_of}>{new Date(meta.as_of).toLocaleString("fa-IR")}</time>}
          {meta?.is_delayed && ` · با ${meta.delayed_minutes} دقیقه تأخیر`}
          {" · نرخ از "}
          <a href="https://netarz.ir/rates" rel="noopener">نِت اَرز</a>
        </small>
      </figcaption>
    </figure>
  );
}
