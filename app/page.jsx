"use client";

import { useEffect, useState, useRef } from "react";

// URL ROBOT ADMIN (APPS SCRIPT)
const AUCTION_API = "https://script.google.com/macros/s/AKfycbxmaYljbsb8Xj_z2Zl1eWQNXJo2PEESj0TriYwiasWqXIEB3rwF2wJxVAsA6qsqkVjR/exec";

export default function Page() {
  /* ===== STATE DATA STORE ===== */
  const [items, setItems] = useState([]);
  const [heroItems, setHeroItems] = useState([]); 
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);

  /* ===== STATE CART & USER ===== */
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [ign, setIgn] = useState("");
  const [waNumber, setWaNumber] = useState(""); // State baru buat No WA bidder

  /* ===== STATE AUCTION (LELANG) ===== */
  const [auctionData, setAuctionData] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("Loading...");

  /* ===== STATE DARK MODE & STORE STATUS ===== */
  const [darkMode, setDarkMode] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  /* ===== LOAD DATA STORE (CSV) ===== */
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
            const catRaw = c[0]?.trim() || "Uncategorized";
            
            if (catRaw.toUpperCase() === "#HERO") {
                return {
                    kategori: "#HERO",
                    nama: c[1]?.trim() || "Unknown",
                    targetKategori: c[2]?.trim(),
                    status: "System"
                };
            }

            return {
              kategori: catRaw,
              nama: c[1]?.trim() || "Unknown",
              buy: parseInt(c[2]?.replace(/\D/g, '')) || 0,
              sell: parseInt(c[3]?.replace(/\D/g, '')) || 0,
              status: c[4]?.trim() || "Kosong",
              promo: c[5]?.trim() || null
            };
          });

        const systemRow = parsed.find(
          item => item.kategori?.toUpperCase() === "#SYSTEM" && item.nama?.toUpperCase() === "STATUS_TOKO"
        );
        setIsStoreOpen(!(systemRow && systemRow.status?.toUpperCase() === "TUTUP"));

        const heroRows = parsed.filter(item => item.kategori === "#HERO");
        const realItems = parsed.filter(item => item.kategori !== "#SYSTEM" && item.kategori !== "#HERO");

        const matchedHeroes = [];
        heroRows.forEach(h => {
            const found = realItems.find(item => 
                item.nama.toLowerCase() === h.nama.toLowerCase() && 
                item.kategori.toLowerCase() === h.targetKategori?.toLowerCase()
            );
            if (found) matchedHeroes.push(found);
        });
        
        setHeroItems(matchedHeroes);
        setItems(realItems);

        const savedIgn = localStorage.getItem("gearShopIGN");
        if (savedIgn) setIgn(savedIgn);
        
        const savedWa = localStorage.getItem("gearShopWA");
        if (savedWa) setWaNumber(savedWa);
        
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

  /* ===== LOAD DATA AUCTION (POLLING) ===== */
  useEffect(() => {
    fetchAuction(); // Load pertama kali
    const interval = setInterval(fetchAuction, 5000); // Refresh tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // Timer Hitung Mundur
  useEffect(() => {
    if (!auctionData || !auctionData.endTime) return;
    const timer = setInterval(() => {
        const end = new Date(auctionData.endTime).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
            setTimeLeft("LELANG DITUTUP");
        } else {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
    }, 1000);
    return () => clearInterval(timer);
  }, [auctionData]);

  async function fetchAuction() {
    try {
        const res = await fetch(AUCTION_API);
        const data = await res.json();
        setAuctionData(data);
    } catch (error) {
        console.error("Gagal load lelang", error);
    }
  }

  /* ===== FUNGSI BIDDING ===== */
  const handleBid = async (action) => {
    if (!ign || !waNumber) {
        alert("Wajib isi IGN dan No WA dulu di bagian atas/keranjang!");
        setCartOpen(true);
        return;
    }

    const amount = action === "BIN" ? auctionData.binPrice : parseInt(bidAmount);
    
    if (action === "BID" && (!amount || amount <= auctionData.currentBid)) {
        alert(`Bid harus lebih tinggi dari ${formatGold(auctionData.currentBid + auctionData.increment)}`);
        return;
    }

    if (!confirm(`Yakin mau ${action} seharga ${amount}?`)) return;

    setBidLoading(true);
    try {
        // Pake 'no-cors' di fetch biasa agak tricky buat baca response,
        // Kita pake text/plain biar ga kena preflight OPTIONS cors
        const payload = JSON.stringify({
            action: action,
            bid: amount,
            ign: ign,
            wa: waNumber
        });

        await fetch(AUCTION_API, {
            method: "POST",
            body: payload,
            headers: { "Content-Type": "text/plain" }
        });

        // Kita asumsi sukses (karena no-cors susah baca error detail di client side simple)
        // Langsung refresh data
        setBidAmount("");
        setTimeout(fetchAuction, 1000); 
        alert("Permintaan dikirim! Tunggu refresh...");

    } catch (error) {
        alert("Gagal kirim bid. Cek koneksi.");
    } finally {
        setBidLoading(false);
    }
  };

  /* ===== TOGGLE THEME ===== */
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("gearShopTheme", newMode ? "dark" : "light");
  };

  /* ===== FILTER & SORT ===== */
  const categories = ["All", ...new Set(items.map(i => i.kategori))];
  const filteredItems = items.filter(i => {
      const nameMatch = i.nama.toLowerCase().includes(search.toLowerCase());
      const catMatch = category === "All" || i.kategori === category;
      return nameMatch && catMatch;
    }).sort((a, b) => {
      if (sort === "buy-asc") return a.buy - b.buy;
      if (sort === "buy-desc") return b.buy - a.buy;
      if (sort === "sell-asc") return a.sell - b.sell;
      if (sort === "sell-desc") return b.sell - a.sell;
      return 0;
    });

  /* ===== UI HELPERS ===== */
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

  /* ===== SEND WA LOGIC ===== */
  const sendWA = () => {
    if (!cart.length) return;
    const userName = ign.trim() || "Guest";
    const userWa = waNumber.trim() || "-";
    
    const itemText = cart.map(c => {
        const unitPrice = c.mode === "buy" ? c.buy : c.sell;
        const subTotal = unitPrice * c.qty;
        let displayCategory = "";
        if (c.kategori && !c.kategori.toLowerCase().includes("diamond")) {
            displayCategory = `[${c.kategori}] `;
        }
        return `${displayCategory}${c.nama} (${c.mode}) x${c.qty} = ${subTotal.toLocaleString('id-ID')} Gold`;
    }).join("%0A");

    const message = `Halo,%20saya%20*${encodeURIComponent(userName)}* (WA: ${userWa})%20mau%20order:%0A${itemText}%0A%0ATotal:%20${totalPrice.toLocaleString('id-ID')}%20Gold`;
    window.open(`https://wa.me/6283101456267?text=${message}`, "_blank");
  };

  const contactAdmin = () => {
    window.open("https://wa.me/6283101456267?text=Halo%20Admin,%20mau%20tanya-tanya%20dong.", "_blank");
  }

  const formatGold = (val) => (
    <span style={{ fontWeight: "bold", color: "#B8860B" }}>
      {val ? val.toLocaleString('id-ID') : 0} 🪙
    </span>
  );

  /* ===== DYNAMIC STYLES ===== */
  const theme = {
    bg: darkMode ? "#121212" : "#f5f5f5",
    text: darkMode ? "#e0e0e0" : "#333",
    cardBg: darkMode ? "#1e1e1e" : "#fff",
    cardBorder: darkMode ? "1px solid #333" : "1px solid #ddd",
    inputBg: darkMode ? "#2c2c2c" : "#fff",
    inputBorder: darkMode ? "1px solid #444" : "1px solid #ccc",
    modalBg: darkMode ? "#1e1e1e" : "#fff",
    subText: darkMode ? "#aaa" : "#666",
    heroBg: darkMode ? "linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)" : "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
    heroBorder: "1px solid #B8860B",
    auctionBg: darkMode ? "linear-gradient(135deg, #2c0000 0%, #4a0000 100%)" : "linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%)",
    auctionBorder: "2px solid #FF4444"
  };

  /* ===== TAMPILAN JIKA TOKO TUTUP ===== */
  if (!loading && !isStoreOpen) {
    return (
      <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
        <img src="/logo.png" height={60} alt="Logo" style={{marginBottom: 20}} />
        <h2 style={{color: "#FF4444", fontSize: 28, marginBottom: 10}}>🔴 TOKO TUTUP</h2>
        <p style={{color: theme.subText, maxWidth: 300, marginBottom: 30}}>Maaf ya, admin lagi istirahat. Cek lagi nanti ya!</p>
        <button onClick={contactAdmin} style={{ background: "#25D366", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 50, fontSize: 16, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 10px rgba(37, 211, 102, 0.4)" }}>
          <span>💬 Chat WhatsApp Admin</span>
        </button>
      </div>
    );
  }

  /* ===== TAMPILAN NORMAL ===== */
  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={{display:"flex", alignItems:"center", gap: 10}}>
            <img src="/logo.png" height={36} alt="Logo" />
        </div>
        <div style={{display:"flex", alignItems:"center", gap: 15}}>
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
        
        {/* === SECTION 1: LIVE AUCTION (NEW!) === */}
        {auctionData && !auctionData.isEnded && (
            <div style={{ marginBottom: 24, padding: 20, background: theme.auctionBg, border: theme.auctionBorder, borderRadius: 12, boxShadow: "0 0 20px rgba(255, 0, 0, 0.2)" }}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 15}}>
                    <h2 style={{margin:0, color:"#FF4444", fontSize: 20}}>🔨 LIVE LELANG</h2>
                    <div style={{background:"red", color:"white", padding:"4px 8px", borderRadius:4, fontSize:12, fontWeight:"bold", animation:"pulse 1s infinite"}}>LIVE</div>
                </div>

                <div style={{textAlign:"center", marginBottom: 20}}>
                    <div style={{fontSize:14, color: theme.subText}}>Item yang dilelang:</div>
                    <strong style={{fontSize: 24, display:"block", margin:"5px 0"}}>{auctionData.item}</strong>
                    <div style={{fontSize: 18, fontWeight:"bold", color:"#FF4444", border:"1px solid #FF4444", display:"inline-block", padding:"4px 12px", borderRadius: 8, marginTop: 5}}>
                        ⏱️ {timeLeft}
                    </div>
                </div>

                <div style={{background: theme.cardBg, padding: 15, borderRadius: 8, marginBottom: 15, border: theme.cardBorder}}>
                    <div style={{display:"flex", justifyContent:"space-between", borderBottom: `1px solid ${darkMode?"#444":"#eee"}`, paddingBottom: 10, marginBottom: 10}}>
                        <span style={{color: theme.subText}}>Harga Tertinggi:</span>
                        <span style={{fontSize:18, fontWeight:"bold", color:"#25D366"}}>{formatGold(auctionData.currentBid)}</span>
                    </div>
                    <div style={{display:"flex", justifyContent:"space-between"}}>
                        <span style={{color: theme.subText}}>Sultan (Leader):</span>
                        <span style={{fontWeight:"bold", color:"#3C6EE2"}}>{auctionData.bidderName || "Belum ada"}</span>
                    </div>
                </div>

                {/* FORM BIDDING */}
                <div style={{display:"flex", gap: 10, flexDirection: "column"}}>
                    <div style={{display:"flex", gap: 5}}>
                        <input 
                            type="number" 
                            placeholder={`Minimal: ${auctionData.currentBid + auctionData.increment}`}
                            value={bidAmount}
                            onChange={e => setBidAmount(e.target.value)}
                            style={{...styles.input, marginBottom:0, flex:1, background: theme.inputBg, color:theme.text, border:theme.inputBorder}}
                        />
                        <button 
                            onClick={() => handleBid("BID")} 
                            disabled={bidLoading}
                            style={{background: "#FF4444", color:"white", border:"none", borderRadius:8, padding:"0 20px", fontWeight:"bold", cursor: "pointer"}}
                        >
                            {bidLoading ? "..." : "BID!"}
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => handleBid("BIN")}
                        disabled={bidLoading}
                        style={{width:"100%", background:"#B8860B", color:"white", border:"none", padding:12, borderRadius:8, fontWeight:"bold", cursor:"pointer"}}
                    >
                         ⚡ BELI LANGSUNG (BIN): {formatGold(auctionData.binPrice)}
                    </button>
                    
                    {(!ign || !waNumber) && <div style={{fontSize:12, color:"orange", textAlign:"center", marginTop:5}}>*Isi IGN & WA di menu Keranjang dulu buat ngebid!</div>}
                </div>
            </div>
        )}

        {auctionData && auctionData.isEnded && (
             <div style={{ marginBottom: 24, padding: 15, background: darkMode?"#222":"#ddd", borderRadius: 12, textAlign:"center", opacity: 0.8 }}>
                <h3>🔒 Lelang Selesai</h3>
                <p>Pemenang: <strong>{auctionData.bidderName}</strong> di harga {formatGold(auctionData.currentBid)}</p>
             </div>
        )}
        
        {/* === SECTION 2: HERO ITEMS (BANNER) === */}
        {heroItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 14, color: "#B8860B", textTransform: "uppercase", letterSpacing: 1 }}>🔥 Hot Items</h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: heroItems.length === 1 ? "1fr" : "repeat(auto-fit, minmax(140px, 1fr))", 
              gap: 12 
            }}>
              {heroItems.map(h => (
                <div key={`hero-${h.nama}-${h.kategori}`} style={{
                  background: theme.heroBg, 
                  border: theme.heroBorder, 
                  borderRadius: 12, 
                  padding: 16, 
                  position: "relative",
                  boxShadow: "0 4px 15px rgba(184, 134, 11, 0.15)"
                }}>
                  <div style={{position: "absolute", top: 10, right: 10, fontSize: 20}}>⭐</div>
                  <div style={{fontSize: 12, color: theme.subText, marginBottom: 4}}>{h.kategori}</div>
                  <strong style={{fontSize: 18, display: "block", marginBottom: 8}}>{h.nama}</strong>
                  <div style={{fontSize: 14, marginBottom: 12}}>Buy: {formatGold(h.buy)}</div>
                  <button 
                    disabled={!canBuy(h.status)} 
                    style={{
                        width: "100%", 
                        padding: 10, 
                        background: canBuy(h.status) ? "#B8860B" : "#555", 
                        color: "#fff", 
                        border: "none", 
                        borderRadius: 8, 
                        fontWeight: "bold", 
                        cursor: "pointer"
                    }}
                    onClick={() => addToCart(h, "buy")}
                  >
                    BELI SEKARANG
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH & FILTER */}
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

        {/* ITEM LIST */}
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
                <h3 style={{ margin: 0 }}>Keranjang & Profil</h3>
                <button onClick={() => setCartOpen(false)} style={{ border: "none", background: "none", fontSize: 24, color: theme.text }}>✕</button>
              </div>

              <div style={{marginBottom: 15, background: darkMode ? "#2c2c2c" : "#f9f9f9", padding: 10, borderRadius: 8, border: theme.inputBorder}}>
                <div style={{fontSize: 12, fontWeight: "bold", marginBottom: 5, color: theme.subText}}>Data Diri (Wajib buat Lelang):</div>
                <input 
                    placeholder="IGN (Nama Game)"
                    value={ign}
                    onChange={e => {
                        setIgn(e.target.value);
                        localStorage.setItem("gearShopIGN", e.target.value);
                    }}
                    style={{...styles.input, marginBottom: 8, padding: 8, fontSize: 14, background: darkMode ? "#1e1e1e" : "#fff", color: theme.text, border: theme.inputBorder}}
                />
                <input 
                    placeholder="Nomor WhatsApp (08xxx)"
                    value={waNumber}
                    onChange={e => {
                        setWaNumber(e.target.value);
                        localStorage.setItem("gearShopWA", e.target.value);
                    }}
                    style={{...styles.input, marginBottom: 0, padding: 8, fontSize: 14, background: darkMode ? "#1e1e1e" : "#fff", color: theme.text, border: theme.inputBorder}}
                />
              </div>
              
              <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
                {cart.length === 0 ? <p style={{textAlign:"center", color:theme.subText}}>Keranjang kosong.</p> : cart.map(c => (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, borderBottom: darkMode ? "1px solid #333" : "1px solid #eee", paddingBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: "bold" }}>{c.nama}</div>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: c.mode === "buy" ? "#25D366" : "#FF8C00" }}>{c.mode === "buy" ? "Beli" : "Jual"}</div>
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

      {/* MODAL KONFIRMASI CHECKOUT */}
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
