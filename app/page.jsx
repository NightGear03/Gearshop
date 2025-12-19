"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetch(
        "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv"
      );
      const text = await res.text();
      const rows = text.split("\n").slice(1);

      const parsed = rows
        .filter(r => r.trim() !== "")
        .map(r => {
          const c = r.split(",");
          return {
            kategori: c[0]?.trim(),
            nama: c[1]?.trim(),
            buy: parseInt(c[2]) || 0,
            sell: parseInt(c[3]) || 0,
            status: c[4]?.trim(),
            promo: c[5]?.trim() || null,
            image: c[6]?.trim() || "",
          };
        });

      setItems(parsed);
      setLoading(false);
    }
    loadData();
  }, []);

  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items
    .filter(item => {
      const nameMatch = item.nama?.toLowerCase().includes(search.toLowerCase());
      const catMatch = category === "All" || item.kategori === category;
      return nameMatch && catMatch;
    })
    .sort((a, b) => {
      if (sort === "buy-asc") return a.buy - b.buy;
      if (sort === "buy-desc") return b.buy - a.buy;
      if (sort === "sell-asc") return a.sell - b.sell;
      if (sort === "sell-desc") return b.sell - a.sell;
      return 0;
    });

  const isBuyEnabled = s => ["full", "ready"].includes(s?.toLowerCase());
  const isSellEnabled = s => ["ready", "take"].includes(s?.toLowerCase());

  const toggleWishlist = item => {
    setWishlist(wishlist.includes(item.nama)
      ? wishlist.filter(i => i !== item.nama)
      : [...wishlist, item.nama]
    );
  };

  return (
    <main style={{ padding: 16 }}>
      <input
        placeholder="Cari item..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle, width: 130 }}>
          <option value="default">Sort</option>
          <option value="buy-asc">Buy ↑</option>
          <option value="buy-desc">Buy ↓</option>
          <option value="sell-asc">Sell ↑</option>
          <option value="sell-desc">Sell ↓</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>
      ) : (
        filteredItems.map(item => (
          <div key={item.nama + item.kategori} style={card}>
            {/* LEFT IMAGE (FIXED SIZE) */}
            <div style={thumbWrap}>
              {item.image && (
                <img
                  src={item.image}
                  alt={item.nama}
                  loading="lazy"
                  onError={e => e.currentTarget.style.display = "none"}
                  style={thumbImg}
                />
              )}
              <span style={wishlistBtn} onClick={() => toggleWishlist(item)}>
                {wishlist.includes(item.nama) ? "❤️" : "🤍"}
              </span>
            </div>

            {/* RIGHT CONTENT */}
            <div style={{ flex: 1 }}>
              <strong>{item.nama}</strong>
              <div style={{ fontSize: 13, color: "#666" }}>{item.kategori}</div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span>Buy: {item.buy}</span>
                <span>Sell: {item.sell}</span>
              </div>

              {item.promo && <div style={promo}>{item.promo}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button disabled={!isBuyEnabled(item.status)} style={{
                  ...btn,
                  background: isBuyEnabled(item.status) ? "#25D366" : "#ccc"
                }}>
                  Beli
                </button>
                <button disabled={!isSellEnabled(item.status)} style={{
                  ...btn,
                  background: isSellEnabled(item.status) ? "#FF8C00" : "#ccc"
                }}>
                  Jual
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </main>
  );
}

/* ===== STYLE ===== */

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc"
};

const card = {
  display: "flex",
  gap: 12,
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: 12,
  marginBottom: 12,
  background: "#fff"
};

const thumbWrap = {
  width: 72,
  height: 72,
  borderRadius: 10,
  background: "#e5e7eb",
  position: "relative",
  overflow: "hidden",
  flexShrink: 0
};

const thumbImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
};

const wishlistBtn = {
  position: "absolute",
  top: 4,
  right: 6,
  fontSize: 16,
  cursor: "pointer"
};

const promo = {
  background: "#FFD700",
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 12,
  marginTop: 6
};

const btn = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  border: "none",
  color: "#fff",
  fontWeight: "bold"
};
