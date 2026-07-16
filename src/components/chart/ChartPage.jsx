// src/components/chart/ChartPage.jsx
// Live charting tab (desktop only) — embeds TradingView's free, official
// "Advanced Real-Time Chart" widget. No API key needed: TradingView serves
// it directly as a script tag that renders an iframe. `allow_symbol_change`
// is on, so people can search any market inside the chart itself; the chips
// above it just shortcut straight to symbols already used in the journal.
import React, { useEffect, useRef, useState } from "react";
import { SERIF, SANS, useTheme } from "../../theme/tokens.js";

// Best-effort mapping from a plain journal ticker (e.g. "AAPL", "BTCUSDT")
// to a TradingView symbol. If the user already stored an exchange-qualified
// symbol (contains ":"), it's passed straight through.
function toTradingViewSymbol(raw) {
  if (!raw) return "NASDAQ:AAPL";
  const s = raw.trim().toUpperCase();
  if (s.includes(":")) return s;
  if (/^[A-Z]{6,10}(USDT|USD|BUSD|BTC|ETH)$/.test(s)) return `BINANCE:${s}`;
  if (/^[A-Z]{3}(USD|JPY|EUR|GBP|CHF|AUD|CAD|NZD)$/.test(s) && s.length === 6) return `FX:${s}`;
  return `NASDAQ:${s}`;
}

function TradingViewWidget({ symbol, themeMode, C }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: themeMode === "dark" ? "dark" : "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: false,
      support_host: "https://www.tradingview.com",
      toolbar_bg: C.bg,
      // Match the widget's colors to the app's own theme tokens instead of
      // TradingView's default light/dark palette — background, grid lines,
      // axis text, and win/loss candle colors all pull straight from C.
      overrides: {
        "paneProperties.background": C.bg,
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": C.lineSoft,
        "paneProperties.horzGridProperties.color": C.lineSoft,
        "scalesProperties.textColor": C.muted,
        "scalesProperties.lineColor": C.line,
        "mainSeriesProperties.candleStyle.upColor": C.sage,
        "mainSeriesProperties.candleStyle.downColor": C.rustRed,
        "mainSeriesProperties.candleStyle.borderUpColor": C.sage,
        "mainSeriesProperties.candleStyle.borderDownColor": C.rustRed,
        "mainSeriesProperties.candleStyle.wickUpColor": C.sage,
        "mainSeriesProperties.candleStyle.wickDownColor": C.rustRed,
      },
    });
    container.appendChild(script);

    return () => { container.innerHTML = ""; };
  }, [symbol, themeMode, C]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }} />
  );
}

export default function ChartPage({ symbolOptions, themeMode }) {
  const C = useTheme();
  const [symbolInput, setSymbolInput] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("NASDAQ:AAPL");

  const journalSymbols = Array.from(
    new Set((symbolOptions || []).map((o) => o.value).filter(Boolean))
  ).slice(0, 12);

  function loadSymbol(raw) {
    const tv = toTradingViewSymbol(raw);
    setActiveSymbol(tv);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (symbolInput.trim()) loadSymbol(symbolInput);
  }

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <div style={{ marginBottom: 16, padding: "0 4px" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Chart</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
          Live chart powered by TradingView — search any market, or jump to a symbol from your journal.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, padding: "0 4px", marginBottom: 12 }}>
        <input
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          placeholder="e.g. AAPL, BTCUSDT, EURUSD…"
          style={{
            flex: 1, height: 36, padding: "0 12px", fontFamily: SANS, fontSize: 13,
            background: C.inputBg, color: C.inputText, border: `1px solid ${C.inputBorder}`, borderRadius: 0,
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            height: 36, padding: "0 16px", fontFamily: SANS, fontWeight: 700, fontSize: 13,
            background: C.btnAccent, color: C.btnAccentTextActive, border: `1px solid ${C.btnAccentBorder}`,
            borderRadius: 0, cursor: "pointer",
          }}
        >
          Load
        </button>
      </form>

      {journalSymbols.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 4px", marginBottom: 16 }}>
          {journalSymbols.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => loadSymbol(s)}
              style={{
                fontFamily: SANS, fontWeight: 600, fontSize: 12, padding: "5px 10px",
                background: C.paperSoftStat, color: C.ink, border: `1px solid ${C.line}`,
                borderRadius: 0, cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          width: "100%", height: 640, background: C.bg, border: `1px solid ${C.line}`,
          borderRadius: 0, boxShadow: C.shadowCard, overflow: "hidden",
        }}
      >
        <TradingViewWidget symbol={activeSymbol} themeMode={themeMode} C={C} />
      </div>
    </div>
  );
}
