// Excel / Power BI: Data > Get Data > From Other Sources > Blank Query > Advanced Editor.
//
// Option A (recommended): read CSV from your relay (../relay/fx-relay.php) on a
// server with a fixed IP. Works from any laptop, whatever its IP is today.
let
    RelayUrl = "https://your-server.example/fx-relay.php",
    RelayToken = "your-relay-token",
    Source = Csv.Document(
        Web.Contents(RelayUrl, [Query = [token = RelayToken, codes = "USD,EUR,AED,TRY", format = "csv"]]),
        [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]
    ),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),
    Typed = Table.TransformColumnTypes(Headers, {
        {"unit", Int64.Type}, {"buy", Int64.Type}, {"sell", Int64.Type}, {"mid", Int64.Type},
        {"change_24h_percent", type number}
    })
in
    Typed

// Option B: call NetArz directly. Only works while the PC's current public IP is
// in the app's allowed IPs (home and mobile IPs in Iran usually change).
// The key must go in a header; ?key= in the URL is not accepted by the API.
//
// let
//     Key = "fx-ntz-v1-your-key-here",
//     Json = Json.Document(Web.Contents("https://netarz.ir/api/fx/v1/rates",
//         [Query = [codes = "USD,EUR,AED"], Headers = [Authorization = "Bearer " & Key]])),
//     Rows = Table.FromRecords(Json[data])
// in
//     Rows
