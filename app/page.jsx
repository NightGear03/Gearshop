"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

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
          const [kategori, nama, buy, sell, status] = r.split(",");
          return { kategori, nama, buy, sell, status };
        });

      setItems(parsed);
    }

    loadData();
  }, []);

  const filteredItems = items.filter(item =>
    item.nama?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* HEADER */}
      <header
        style={{
          background: "#3C6EE2",
          padding: "12px 16px",
          color: "#fff"
        }}
      >
        <img src="/logo.png" alt="Gearshop" style={{ height: 40 }} />
      </header>

      {/* CONTENT */}
      <main style={{ padding: 16 }}>
        <input
          type="text"
          placeholder="Cari item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            marginBottom: 16
          }}
        />

        {filteredItems.map((item, i) => (
          <div
            key={i}
            style={{
              padding: 12,
              marginBottom: 8,
              border: "1px solid #ddd",
              borderRadius: 8
            }}
          >
            <strong>{item.nama}</strong>
            <div>Buy: {item.buy}</div>
            <div>Sell: {item.sell}</div>
            <div>Status: {item.status}</div>
          </div>
        ))}
      </main>
    </>
  );
}
