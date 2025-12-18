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

      <ul>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: 12 }}>
            <b>{item.nama}</b> ({item.kategori})<br />
            Buy: {item.buy} | Sell: {item.sell}<br />
            Status: {item.status}
          </li>
        ))}
      </ul>

      <a href="https://wa.me/6283101456267">
        Chat GEAR SHOP
      </a>
    </main>
  );
}
