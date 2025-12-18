import { useState } from "react";
async function getData() {
  const res = await fetch(
    "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv",
    { cache: "no-store" }
  );

  const text = await res.text();
  const rows = text.split("\n").slice(1);

  return rows
    .filter(row => row.trim() !== "")
    .map(row => {
      const [kategori, nama, buy, sell, status] = row.split(",");
      return { kategori, nama, buy, sell, status };
    });
}

export default function Page({ items }) {
  const [search, setSearch] = useState("");
  
const filteredItems = items.filter(item =>
  item.nama.toLowerCase().includes(search.toLowerCase())
);
  return (
    <>
      {/* HEADER */}
      <header
        style={{
          background: "#3C6EE2",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center"
        }}
      >
        <img
          src="/logo.png"
          alt="Gearshop"
          style={{ height: 40 }}
        />
      </header>
      <input
  type="text"
  placeholder="Cari item..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginBottom: 16
  }}
/>

      {/* CONTENT */}
      <main style={{ padding: 16, fontFamily: "sans-serif", background: "#f5f7ff", minHeight: "100vh" }}>style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#3C6EE2" }}>Gearshop</h1>
<p style={{ color: "#555" }}>Katalog item & harga</p>

      {items.length === 0 && <p>Belum ada item.</p>}

      <div style={{ display: "grid", gap: 12 }}>
  {filteredItems.map((item, i) => (
    <div
      key={i}
      style={{
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 12,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ fontSize: 16, fontWeight: "bold" }}>
        {item.nama}
      </div>

      <div style={{ fontSize: 13, color: "#666" }}>
        {item.kategori}
      </div>

      <div style={{ marginTop: 6 }}>
        Buy: <b>{item.buy}</b> | Sell: <b>{item.sell}</b>
      </div>

      <div style={{ marginTop: 6 }}>
        {item.status?.toLowerCase().includes("ready") ? (
          <span style={{ color: "green", fontWeight: "bold" }}>
            🟢 Ready
          </span>
        ) : (
          <span style={{ color: "red", fontWeight: "bold" }}>
            🔴 Kosong
          </span>
        )}
      </div>
    </div>
  ))}
</div>
      

      <a href="https://wa.me/6283101456267">
        Chat GEAR SHOP
      </a>
    </main>
  );
}
export async function getServerSideProps() {
  const res = await fetch(
    "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv",
    { cache: "no-store" }
  );

  const text = await res.text();
  const rows = text.split("\n").slice(1);

  const items = rows
    .filter(row => row.trim() !== "")
    .map(row => {
      const [kategori, nama, buy, sell, status] = row.split(",");
      return { kategori, nama, buy, sell, status };
    });

  return { props: { items } };
      }
