"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function loadData() {
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
            buy: c[2]?.trim(),
            sell: c[3]?.trim(),
            status: c[4]?.trim()
          };
        });

      setItems(parsed);
    }

    loadData();
  }, []);

  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items.filter(item => {
    const nameMatch = item.nama
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const catMatch =
      category === "All" || item.kategori === category;

    return nameMatch && catMatch;
  });

  const statusIcon = status => {
    const s = status?.toLowerCase();
    if (s === "ready") return "🟢 Ready";
    if (s === "kosong") return "🔴 Kosong";
    if (s === "take") return "🟡 Take";
    return status;
  };

  return (
    <>
      <header style={{ background: "#3C6EE2", padding: 12 }}>
        <img src="/logo.png" height={40} />
      </header>

      <main style={{ padding: 16 }}>
        <input
          placeholder="Cari item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={inputStyle}
        >
          {categories.map((c, i) => (
            <option key={i}>{c}</option>
          ))}
        </select>

        {filteredItems.map((item, i) => (
          <div key={i} style={cardStyle}>
            <strong>{item.nama}</strong>
            <div style={{ fontSize: 13, color: "#666" }}>
              {item.kategori}
            </div>

            <div>Buy: {item.buy}</div>
            <div>Sell: {item.sell}</div>
            <div>Status: {statusIcon(item.status)}</div>

            <a
              href={`https://wa.me/62XXXXXXXXXX?text=Halo,%20saya%20mau%20order%20${item.nama}`}
              target="_blank"
              style={waStyle}
            >
              Order via WhatsApp
            </a>
          </div>
        ))}
      </main>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #ccc"
};

const cardStyle = {
  padding: 14,
  border: "1px solid #ddd",
  borderRadius: 10,
  marginBottom: 10
};

const waStyle = {
  display: "block",
  marginTop: 10,
  background: "#25D366",
  color: "#fff",
  textAlign: "center",
  padding: 10,
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: "bold"
};
