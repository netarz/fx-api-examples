// Command rates prints Toman exchange rates from the NetArz FX API.
//
// Standard library only (net/http). Server-side calls carry no Origin header,
// so this machine's outgoing IP must be in the app's "IPهای مجاز" list at
// https://netarz.ir/fx
//
//	export NETARZ_FX_KEY=fx-ntz-v1-...
//	go run .                 # USD, EUR, AED
//	go run . USD TRY GBP     # any codes, one request
//
// Docs: https://netarz.ir/docs/fx/rates
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

const baseURL = "https://netarz.ir/api/fx/v1"

// Rate is one row of GET /rates. Prices are Toman for Unit units of the currency.
type Rate struct {
	Code             string   `json:"code"`
	Name             string   `json:"name"`
	NameEn           string   `json:"name_en"`
	Unit             int      `json:"unit"`
	Buy              float64  `json:"buy"`
	Sell             float64  `json:"sell"`
	Mid              float64  `json:"mid"`
	Change24hPercent *float64 `json:"change_24h_percent"`
}

// Meta is the "meta" object of a rates response.
type Meta struct {
	AsOf           string `json:"as_of"`
	Plan           string `json:"plan"`
	IsDelayed      bool   `json:"is_delayed"`
	DelayedMinutes int    `json:"delayed_minutes"`
}

type ratesResponse struct {
	Data []Rate `json:"data"`
	Meta Meta   `json:"meta"`
}

// APIError is the {"error": {...}} body of a non-2xx answer.
type APIError struct {
	Status  int
	Code    string `json:"code"`
	Message string `json:"message"`
	IP      string `json:"ip"` // present on ip_not_allowed / origin_required
}

func (e *APIError) Error() string {
	if e.IP != "" {
		return fmt.Sprintf("%d %s: %s (add this IP in the panel: %s)", e.Status, e.Code, e.Message, e.IP)
	}
	return fmt.Sprintf("%d %s: %s", e.Status, e.Code, e.Message)
}

// Client is a small FX API client with an in-memory cache.
type Client struct {
	key  string
	http *http.Client
	ttl  time.Duration

	mu    sync.Mutex
	cache map[string]cached
}

type cached struct {
	at   time.Time
	body ratesResponse
}

// NewClient forces IPv4, so the source IP NetArz sees is the IPv4 address you
// allow-listed. Use "tcp" instead of "tcp4" if you allow-listed IPv6.
func NewClient(key string) *Client {
	dialer := &net.Dialer{Timeout: 5 * time.Second}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.DialContext = func(ctx context.Context, _, addr string) (net.Conn, error) {
		return dialer.DialContext(ctx, "tcp4", addr)
	}
	return &Client{
		key:   key,
		http:  &http.Client{Timeout: 10 * time.Second, Transport: transport},
		ttl:   2 * time.Minute, // rates refresh every few minutes (meta.refresh_interval_minutes)
		cache: map[string]cached{},
	}
}

// Rates fetches several currencies in one request (cheaper than one call each).
func (c *Client) Rates(ctx context.Context, codes []string) (ratesResponse, error) {
	q := url.Values{}
	if len(codes) > 0 {
		q.Set("codes", strings.ToUpper(strings.Join(codes, ",")))
	}
	endpoint := baseURL + "/rates?" + q.Encode()

	c.mu.Lock()
	hit, ok := c.cache[endpoint]
	c.mu.Unlock()
	if ok && time.Since(hit.at) < c.ttl {
		return hit.body, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return ratesResponse{}, err
	}
	req.Header.Set("Authorization", "Bearer "+c.key)
	req.Header.Set("Accept", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return ratesResponse{}, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		var wrapped struct {
			Error APIError `json:"error"`
		}
		_ = json.NewDecoder(res.Body).Decode(&wrapped)
		wrapped.Error.Status = res.StatusCode
		return ratesResponse{}, &wrapped.Error
	}

	var body ratesResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return ratesResponse{}, err
	}

	c.mu.Lock()
	c.cache[endpoint] = cached{at: time.Now(), body: body}
	c.mu.Unlock()
	return body, nil
}

func main() {
	key := os.Getenv("NETARZ_FX_KEY")
	if key == "" {
		fmt.Fprintln(os.Stderr, "Set NETARZ_FX_KEY first (create an app at https://netarz.ir/fx).")
		os.Exit(2)
	}

	codes := os.Args[1:]
	if len(codes) == 0 {
		codes = []string{"USD", "EUR", "AED"}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	board, err := NewClient(key).Rates(ctx, codes)
	if err != nil {
		var apiErr *APIError
		if errors.As(err, &apiErr) && apiErr.Code == "pro_required" {
			fmt.Fprintln(os.Stderr, "This currency or feature needs the Pro plan: https://netarz.ir/docs/fx/plans")
		}
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	for _, r := range board.Data {
		change := "-"
		if r.Change24hPercent != nil {
			change = fmt.Sprintf("%+.2f%%", *r.Change24hPercent)
		}
		fmt.Printf("%s\tbuy %.0f\tsell %.0f\tper %d\t%s\n", r.Code, r.Buy, r.Sell, r.Unit, change)
	}
	delay := "live"
	if board.Meta.IsDelayed {
		delay = fmt.Sprintf("delayed %d min", board.Meta.DelayedMinutes)
	}
	fmt.Printf("as of %s (%s, plan: %s)\n", board.Meta.AsOf, delay, board.Meta.Plan)
}
