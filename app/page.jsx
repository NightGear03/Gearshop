"use client";

import { useEffect, useState } from "react";

export default function Page() {
  /* ===== STATE DATA ===== */
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [ign, setIgn] = useState("");

  /* ===== STATE DARK MODE (BARU) ===== */
  // Default true biar langsung mode gaming (gelap), bisa diganti false kalau mau terang duluan
  const [darkMode, setDarkMode] = useState(true);

  /* ===== LOAD DATA ===== */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(
          "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv"
        );
        const text = await res.text();
        const rows = text.split(/\r?\n/).slice(1);

        const parsed = rows
          .filter(r => r.trim() !== "")
          .map(r => {
            const c = r.split(",");
            return {
              kategori: c[0]?.trim() || "Uncategorized",
              nama: c[1]?.trim() || "Unknown",
              buy: parseInt(c[2]?.replace(/\D/g, '')) || 0,
              sell: parseInt(c[3]?.replace(/\D/g, '')) || 0,
              status: c[4]?.trim() || "Kosong",
              promo: c[5]?.trim() || null
            };
          });
        setItems(parsed);

        // Load IGN & Dark Mode Setting
        const savedIgn = localStorage.getItem("gearShopIGN");
        if (savedIgn) setIgn(savedIgn);
        
        // Cek simpanan tema user
        const savedTheme = localStorage.getItem("gearShopTheme");
        if (savedTheme) setDarkMode(savedTheme === "dark");

      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /* ===== TOGGLE THEME ===== */
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("gearShopTheme", newMode ? "dark" : "light");
  };

  /* ===== FILTER & SORT ===== */
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

  /* ===== STATUS UI ===== */
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

  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + (c.mode === "buy" ? c.buy : c.sell) * c.qty, 0);

  const sendWA = () => {
    if (!cart.length) return;
    const userName = ign.trim() || "Guest";
    const itemText = cart.map(c => {
        const unitPrice = c.mode === "buy" ? c.buy : c.sell;
        const subTotal = unitPrice * c.qty;
        return `${c.nama} (${c.mode}) x${c.qty} = ${subTotal.toLocaleString('id-ID')} Gold`;
    }).join("%0A");

    const message = `Halo,%20saya%20*${encodeURIComponent(userName)}*%20mau%20order:%0A${itemText}%0A%0ATotal:%20${totalPrice.toLocaleString('id-ID')}%20Gold`;
    window.open(`https://wa.me/6283101456267?text=${message}`, "_blank");
  };

  /* Helper Format Gold */
  const formatGold = (val) => (
    <span style={{ fontWeight: "bold", color: "#B8860B" }}>
      {val.toLocaleString('id-ID')} 🪙
    </span>
  );

  /* ===== DYNAMIC STYLES (DARK/LIGHT) ===== */
  const theme = {
    bg: darkMode ? "#121212" : "#f5f5f5",
    text: darkMode ? "#e0e0e0" : "#333",
    cardBg: darkMode ? "#1e1e1e" : "#fff",
    cardBorder: darkMode ? "1px solid #333" : "1px solid #ddd",
    inputBg: darkMode ? "#2c2c2c" : "#fff",
    inputBorder: darkMode ? "1px solid #444" : "1px solid #ccc",
    modalBg: darkMode ? "#1e1e1e" : "#fff",
    subText: darkMode ? "#aaa" : "#666"
  };

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={{display:"flex", alignItems:"center", gap: 10}}>
            <img src="/logo.png" height={36} alt="Logo" />
        </div>
        
        <div style={{display:"flex", alignItems:"center", gap: 15}}>
            {/* TOMBOL DARK MODE */}
            <div style={{cursor:"pointer", fontSize: 20}} onClick={toggleTheme}>
                {darkMode ? "☀️" : "🌙"}
            </div>
            
            <div style={styles.cartIcon} onClick={() => setCartOpen(true)}>
                🛒
                {cart.length > 0 && <span style={styles.cartBadge}>{totalQty}</span>}
            </div>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        <input
          placeholder="Cari item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{...styles.input, background: theme.inputBg, color: theme.text, border: theme.inputBorder}}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            style={{...styles.input, flex: 1, background: theme.inputBg, color: theme.text, border: theme.inputBorder}}
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select 
            value={sort} 
            onChange={e => setSort(e.target.value)} 
            style={{...styles.input, width: 140, background: theme.inputBg, color: theme.text, border: theme.inputBorder}}
          >
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
            <div key={`${i.nama}-${i.kategori}`} style={{...styles.card, background: theme.cardBg, border: theme.cardBorder}}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{fontSize: 16}}>{i.nama}</strong>
                <span style={{ cursor: "pointer" }} onClick={() => setWishlist(
                  wishlist.includes(i.nama) ? wishlist.filter(w => w !== i.nama) : [...wishlist, i.nama]
                )}>
                  {wishlist.includes(i.nama) ? "❤️" : "🤍"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: theme.subText, marginBottom: 8 }}>{i.kategori}</div>
              
              <div style={{display:"flex", justifyContent:"space-between", fontSize: 14}}>
                  <span>Buy: {formatGold(i.buy)}</span>
                  <span>Sell: {formatGold(i.sell)}</span>
              </div>
              
              {i.promo && <div style={styles.promo}>{i.promo}</div>}
              <div style={{marginTop: 6, fontSize: 14}}>Status: {statusLabel(i.status)}</div>
              
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button disabled={!canBuy(i.status)} style={{ ...styles.btn, background: canBuy(i.status) ? "#25D366" : "#555", color: canBuy(i.status)?"#fff":"#888" }} onClick={() => addToCart(i, "buy")}>Beli</button>
                <button disabled={!canSell(i.status)} style={{ ...styles.btn, background: canSell(i.status) ? "#FF8C00" : "#555", color: canSell(i.status)?"#fff":"#888" }} onClick={() => addToCart(i, "sell")}>Jual</button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* CART PANEL */}
      <div style={{ 
        ...styles.cartPanel, 
        transform: cartOpen ? "translateX(0)" : "translateX(100%)", 
        background: theme.modalBg,
        color: theme.text
      }}>
        <div style={{height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <h3 style={{ margin: 0 }}>Keranjang</h3>
                <button onClick={() => setCartOpen(false)} style={{ border: "none", background: "none", fontSize: 24, color: theme.text }}>✕</button>
              </div>

              {/* INPUT IGN */}
              <div style={{marginBottom: 15, background: darkMode ? "#2c2c2c" : "#f9f9f9", padding: 10, borderRadius: 8, border: theme.inputBorder}}>
                <div style={{fontSize: 12, fontWeight: "bold", marginBottom: 5, color: theme.subText}}>Nama In-Game (IGN):</div>
                <input 
                    placeholder="Contoh: DragonSlayer99"
                    value={ign}
                    onChange={e => {
                        setIgn(e.target.value);
                        localStorage.setItem("gearShopIGN", e.target.value);
                    }}
                    style={{
                        ...styles.input, 
                        marginBottom: 0, padding: 8, fontSize: 14, 
                        background: darkMode ? "#1e1e1e" : "#fff", 
                        color: theme.text, border: theme.inputBorder
                    }}
                />
              </div>
              
              <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                {cart.map(c => (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, borderBottom: darkMode ? "1px solid #333" : "1px solid #eee", paddingBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: "bold" }}>{c.nama}</div>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: c.mode === "buy" ? "#25D366" : "#FF8C00" }}>
                        {c.mode === "buy" ? "Beli" : "Jual"}
                      </div>
                    </div>
                    <input type="number" value={c.qty} onChange={e => updateQty(c, parseInt(e.target.value))} style={{ width: 45, padding: "4px", textAlign: "center", background: theme.inputBg, color: theme.text, border: theme.inputBorder, borderRadius: 4 }} />
                    <span style={{ fontSize: 13, minWidth: 40, textAlign: "right" }}>
                       {formatGold((c.mode === "buy" ? c.buy : c.sell) * c.qty)}
                    </span>
                    <button onClick={() => removeFromCart(c)} style={{ border: "none", background: "none", color: "red", marginLeft: 5 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {cart.length > 0 && (
              <div style={{ borderTop: darkMode ? "2px solid #333" : "2px solid #ddd", paddingTop: 15 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>Total Item:</span>
                  <span>{totalQty}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 18, marginTop: 4, marginBottom: 15 }}>
                  <span>Total Harga:</span>
                  <span>{formatGold(totalPrice)}</span>
                </div>
                <button style={{ ...styles.btn, background: "#25D366", padding: 16, width: "100%", fontSize: 16, fontWeight: "bold", color: "#fff" }} onClick={() => setConfirmOpen(true)}>
                  Checkout WA
                </button>
              </div>
            )}
        </div>
      </div>

      {cartOpen && <div style={styles.backdrop} onClick={() => setCartOpen(false)} />}

      {/* MODAL KONFIRMASI */}
      {confirmOpen && (
        <div style={styles.modalWrap} onClick={() => setConfirmOpen(false)}>
          <div style={{...styles.modal, background: theme.modalBg, color: theme.text}} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Konfirmasi</h3>
            <div style={{ marginBottom: 15, textAlign: "center" }}>
              <div style={{color: theme.subText, fontSize: 14}}>Order atas nama:</div>
              <div style={{fontWeight:"bold", fontSize:16, color: "#3C6EE2", marginBottom: 10}}>{ign || "Guest"}</div>
              Total Pesanan:<br/>
              <strong style={{ fontSize: 20 }}>{formatGold(totalPrice)}</strong>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...styles.btn, background: darkMode ? "#333" : "#eee", color: darkMode ? "#fff" : "#333", padding: 12 }} onClick={() => setConfirmOpen(false)}>Batal</button>
              <button style={{ ...styles.btn, background: "#25D366", padding: 12, fontWeight: "bold", color:"#fff" }} onClick={() => { sendWA(); setConfirmOpen(false); }}>Lanjut WA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== STATIC STYLES ===== */
const styles = {
    header: { background: "#3C6EE2", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", position: "sticky", top: 0, zIndex: 10 },
    cartIcon: { position: "relative", cursor: "pointer", fontSize: 24 },
    cartBadge: { position: "absolute", top: -6, right: -6, background: "red", color: "#fff", borderRadius: "50%", padding: "2px 6px", fontSize: 12, fontWeight: "bold" },
    input: { width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, outline: "none" },
    card: { borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
    promo: { background: "#FFD700", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontWeight: "bold", display: "inline-block", margin: "6px 0", color: "#000" },
    btn: { flex: 1, border: "none", borderRadius: 8, cursor: "pointer", textAlign: "center", padding: "10px 0" },
    cartPanel: { position: "fixed", top: 0, right: 0, width: "320px", maxWidth: "85%", height: "100%", padding: "20px", boxShadow: "-2px 0 10px rgba(0,0,0,0.3)", transition: "0.3s", zIndex: 999 },
    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 },
    modalWrap: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", zIndex: 1000, padding: 20 },
    modal: { padding: 24, borderRadius: 12, width: "100%", maxWidth: "320px", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }
};
