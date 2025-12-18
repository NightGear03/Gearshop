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

export default async function Page() {
  const items = await getData();

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Gearshop</h1>
      <p>Katalog item & harga</p>

      {items.length === 0 && <p>Belum ada item.</p>}

      <div style={{ display: "grid", gap: 12 }}>
  {items.map((item, i) => (
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
