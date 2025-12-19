"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  /* ===== LOAD SHEET ===== */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(
          "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv"
        );
        const text = await res.text();
        // Menggunakan regex untuk split baris agar handle karakter \r dari Windows
        const rows = text.split(/\r?\n/).slice(1);

        const parsed = rows
          .filter(r => r.trim() !== "")
          .map(r => {
            const c = r.split(",");
            return {
              kategori: c[0]?.trim() || "Uncategorized",
              nama: c[1]?.trim() || "Unknown",
              // Membersihkan karakter non-angka sebelum parse
              buy: parseInt(c[2]?.replace(/\D/g, '')) || 0,
              sell: parseInt(c[3]?.replace(/\D/g, '')) || 0,
              status: c[4]?.trim() || "Kosong",
              promo: c[5]?.trim() || null
            };
          });

        setItems(parsed);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /* ===== FILTER ===== */
  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items
    .filter(i => {
      const nameMatch = i.nama.toLowerCase().includes(search.toLowerCase());
      const catMatch = category === "All" || i.kategori === category;
      return nameMatch && catMatch;
    })
    .sort((a, b) => {
      if (sort === "buy-asc") return a.buy - b.buy;
      if (sort === "buy-desc") return b.buy - a.buy;
      if (sort === "sell-asc") return a.sell - b.sell;
      if (sort === "sell-desc") return b.sell - a.sell;
      return 0;
    });

  /* ===== STATUS ===== */
  const statusLabel = s => {
    const v = s?.toLowerCase();
    if (v === "full") return "🟢 Full";
    if (v === "ready") return "🔵 Ready";
    if (v === "take") return "🟡 Take";
    if (v === "kosong") return "🔴 Kosong";
    return s;
  };

  const canBuy = s => ["full", "ready"].includes(s?.toLowerCase());
  const canSell = s => ["ready", "take"].includes(s?.toLowerCase());

  /* ===== CART LOGIC ===== */
  const addToCart = (item, mode) => {
    if (item.status?.toLowerCase() === "kosong") return;
    const key = `${item.nama}-${mode}`;
    const exist = cart.find(c => c.key === key);

    if (exist) {
      setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, mode, qty: 1, key }]);
    }
    setCartOpen(true);
  };

  const updateQty = (item, qty) => {
    if (qty < 1) return;
    setCart(cart.map(c => c.key === item.key ? { ...c, qty } : c));
  };

  const removeFromCart = item => {
    setCart(cart.filter(c => c.key !== item.key));
  };

  // Menghitung total jumlah barang (qty), bukan cuma jumlah baris
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  const totalPrice = cart.reduce(
    (s, c) => s + (c.mode === "buy" ? c.buy : c.sell) * c.qty, 0
  );

  const sendWA = () => {
    if (!cart.length) return;
    const itemText = cart.map(
      c => `${c.nama} (${c.mode}) x${c.qty} = ${(c.mode === "buy" ? c.buy : c.sell) * c.qty}`
    ).join("%0A");

    const message = `Halo,%20saya%20mau%20order:%0A${itemText}%0A%0ATotal:%20${totalPrice}`;
    window.open(`https://wa.me/6283101456267?text=${message}`, "_blank");
  };

  /* ===== UI RENDER ===== */
  return (
    <>
      {/* HEADER */}
      <header style={header}>
        <img src="/logo.png" height={40} alt="Logo" />
        <div style={cartIcon} onClick={() => setCartOpen(true)}>
          🛒
          {cart.length > 0 && <span style={cartBadge}>{totalQty}</span>}
        </div>
      </header>

      <main style={{ padding: 16 }}>
        <input
          placeholder="Cari item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={input}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...input, flex: 1 }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...input, width: 140 }}>
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
          filteredItems.map((i) => (
            <div key={`${i.nama}-${i.kategori}`} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{i.nama}</strong>
                <span style={{ cursor: "pointer" }} onClick={() => setWishlist(
                  wishlist.includes(i.nama)
                    ? wishlist.filter(w => w !== i.nama)
                    : [...wishlist, i.nama]
                )}>
                  {wishlist.includes(i.nama) ? "❤️" : "🤍"}
                </span>
              </div>

              <div style={{ fontSize: 13, color: "#666" }}>{i.kategori}</div>
              <div>Buy: {i.buy.toLocaleString()}</div>
              <div>Sell: {i.sell.toLocaleString()}</div>
              {i.promo && <div style={promo}>{i.promo}</div>}
              <div>Status: {statusLabel(i.status)}</div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  disabled={!canBuy(i.status)}
                  style={{ ...btn, background: canBuy(i.status) ? "#25D366" : "#ccc" }}
                  onClick={() => addToCart(i, "buy")}
                >
                  Beli
                </button>
                <button
                  disabled={!canSell(i.status)}
                  style={{ ...btn, background: canSell(i.status) ? "#FF8C00" : "#ccc" }}
                  onClick={() => addToCart(i, "sell")}
                >
                  Jual
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* CART PANEL */}
      <div style={{
        ...cartPanel,
        transform: cartOpen ? "translateX(0)" : "translateX(100%)",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Keranjang</h3>
          <button onClick={() => setCartOpen(false)} style={{ border: "none", background: "none", fontSize: 20 }}>✖</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
          {cart.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: "bold" }}>{c.nama}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{c.mode === "buy" ? "Beli" : "Jual"}</div>
              </div>
              <input
                type="number"
                value={c.qty}
                onChange={e => updateQty(c, parseInt(e.target.value))}
                style={{ width: 45, padding: "4px" }}
              />
              <span style={{ fontSize: 14 }}>{(c.mode === "buy" ? c.buy : c.sell) * c.qty}</span>
              <button onClick={() => removeFromCart(c)} style={{ border: "none", background: "none", color: "red" }}>✕</button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "2px solid #ddd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>Total Item:</span>
              <span>{totalQty}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 18, marginTop: 4 }}>
              <span>Total Harga:</span>
              <span>{totalPrice.toLocaleString()}</span>
            </div>

            <button
              style={{
                ...btn,
                background: "#25D366",
                marginTop: 16,
                padding: 14,
                width: "100%",
                fontSize: 16,
                fontWeight: "bold",
                cursor: "pointer"
              }}
              onClick={() => setConfirmOpen(true)}
            >
              Checkout WA
            </button>
          </div>
        )}
      </div>

      {cartOpen && <div style={backdrop} onClick={() => setCartOpen(false)} />}

      {/* MODAL KONFIRMASI DENGAN TOMBOL BATAL */}
      {confirmOpen && (
        <div style={modalWrap} onClick={() => setConfirmOpen(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Konfirmasi</h3>
            <div style={{ marginBottom: 20 }}>
              Total Pesanan: <strong>{totalPrice.toLocaleString()}</strong>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ ...btn, background: "#ccc", color: "#333", padding: 10 }}
                onClick={() => setConfirmOpen(false)}
              >
                Batal
              </button>
              <button
                style={{ ...btn, background: "#25D366", padding: 10 }}
                onClick={() => { sendWA(); setConfirmOpen(false); }}
              >
                Lanjut WA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== STYLE OBJECTS ===== */
const header = { background: "#3C6EE2", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" };
const cartIcon = { position: "relative", cursor: "pointer", fontSize: 24 };
const cartBadge = { position: "absolute", top: -6, right: -6, background: "red", color: "#fff", borderRadius: "50%", padding: "2px 6px", fontSize: 12, fontWeight: "bold" };
const input = { width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16 };
const card = { border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 10, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const promo = { background: "#FFD700", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontWeight: "bold", display: "inline-block", margin: "4px 0" };
const btn = { flex: 1, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", transition: "0.2s", textAlign: "center" };
const cartPanel = { position: "fixed", top: 0, right: 0, width: "320px", maxWidth: "85%", height: "100%", background: "#fff", padding: 16, boxShadow: "-2px 0 10px rgba(0,0,0,0.1)", transition: "0.3s", zIndex: 999 };
const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 998 };
const modalWrap = { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", zIndex: 1000, padding: 20 };
const modal = { background: "#fff", padding: 24, borderRadius: 12, width: "100%", maxWidth: "320px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" };
