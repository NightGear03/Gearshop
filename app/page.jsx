"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

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
            promo: c[5]?.trim() || null
          };
        });

      setItems(parsed);
      setLoading(false);
    }

    loadData();
  }, []);

  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items.filter(item => {
    const nameMatch = item.nama?.toLowerCase().includes(search.toLowerCase());
    const catMatch = category === "All" || item.kategori === category;
    return nameMatch && catMatch;
  });

  const statusIcon = status => {
    const s = status?.toLowerCase();
    if (s === "ready") return "🟢 Ready";
    if (s === "kosong") return "🔴 Kosong";
    if (s === "take") return "🟡 Take";
    return status;
  };

  const addToCart = (item, mode = "buy") => {
    if (item.status?.toLowerCase() === "kosong") return;
    const key = `${item.nama}-${mode}`;
    const existing = cart.find(c => c.key === key);
    if (existing) {
      setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1, mode, key }]);
    }
    setCartOpen(true);
  };

  const removeFromCart = item => {
    setCart(cart.filter(c => c.key !== item.key));
  };

  const updateQty = (item, qty) => {
    if (qty < 1) return;
    setCart(cart.map(c => c.key === item.key ? { ...c, qty } : c));
  };

  const totalPrice = cart.reduce((sum, c) => sum + (c.mode === "buy" ? c.buy : c.sell) * c.qty, 0);

  const sendWA = () => {
    if (!cart.length) return;
    const text = cart
      .map(c => `${c.nama} (${c.mode}) x${c.qty} = ${c.mode === "buy" ? c.buy * c.qty : c.sell * c.qty}`)
      .join("%0A");
    const msg = `Halo,%20saya%20mau%20order:%0A${text}%0ATotal: ${totalPrice}`;
    window.open(`https://wa.me/6283101456267?text=${msg}`, "_blank");
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

        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>
        ) : (
          filteredItems.map((item, i) => (
            <div key={i} style={cardStyle}>
              <strong>{item.nama}</strong>
              <div style={{ fontSize: 13, color: "#666" }}>{item.kategori}</div>

              <div>Buy: {item.buy}</div>
              <div>Sell: {item.sell}</div>
              {item.promo && <div style={promoStyle}>{item.promo}</div>}
              <div>Status: {statusIcon(item.status)}</div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => addToCart(item, "buy")}
                  disabled={item.status?.toLowerCase() === "kosong"}
                  style={{
                    ...waStyle,
                    background: item.status?.toLowerCase() === "kosong" ? "#ccc" : "#25D366"
                  }}
                >
                  {item.status?.toLowerCase() === "kosong" ? "Kosong" : "Beli"}
                </button>
                <button
                  onClick={() => addToCart(item, "sell")}
                  disabled={item.status?.toLowerCase() === "kosong"}
                  style={{
                    ...waStyle,
                    background: item.status?.toLowerCase() === "kosong" ? "#ccc" : "#FF8C00"
                  }}
                >
                  {item.status?.toLowerCase() === "kosong" ? "Kosong" : "Jual"}
                </button>
              </div>
            </div>
          ))
        )}

        {/* Cart Side Panel */}
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100%",
            width: "40%", // desktop ~40% layar
            minWidth: 280,
            maxWidth: 350,
            background: "#fff",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
            transform: cartOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s ease",
            zIndex: 999,
            overflowY: "auto",
            padding: 16,
            borderRadius: "8px 0 0 8px"
          }}
        >
          <button
            onClick={() => setCartOpen(false)}
            style={{ float: "right", cursor: "pointer", marginBottom: 10 }}
          >
            ✖
          </button>
          <h3>Keranjang</h3>
          {cart.length === 0 && <div>Keranjang kosong</div>}
          {cart.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <span style={{ flex: 1 }}>{c.nama} ({c.mode})</span>
              <input
                type="number"
                value={c.qty}
                onChange={e => updateQty(c, parseInt(e.target.value))}
                style={{ width: 50, marginRight: 10 }}
              />
              <span style={{ marginRight: 10 }}>{c.mode === "buy" ? c.buy * c.qty : c.sell * c.qty}</span>
              <button onClick={() => removeFromCart(c)} style={removeBtnStyle}>Hapus</button>
            </div>
          ))}
          {cart.length > 0 && (
            <>
              <div style={{ fontWeight: "bold", marginTop: 8 }}>Total: {totalPrice}</div>
              <button onClick={sendWA} style={waModalStyle}>Checkout via WhatsApp</button>
            </>
          )}
        </div>

        {/* Backdrop */}
        {cartOpen && (
          <div
            onClick={() => setCartOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.3)",
              zIndex: 998
            }}
          ></div>
        )}
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
  marginBottom: 10,
  transition: "transform 0.2s",
  cursor: "pointer"
};

const waStyle = {
  display: "block",
  flex: 1,
  color: "#fff",
  textAlign: "center",
  padding: 10,
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: "bold",
  cursor: "pointer",
  border: "none"
};

const waModalStyle = {
  width: "100%",
  background: "#25D366",
  color: "#fff",
  textAlign: "center",
  padding: 12,
  borderRadius: 8,
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: 10
};

const removeBtnStyle = {
  background: "#E74C3C",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer"
};

const promoStyle = {
  background: "#FFD700",
  color: "#000",
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 12,
  marginTop: 4
};
