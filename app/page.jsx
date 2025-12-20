"use client";

import { useEffect, useState } from "react";

const AUCTION_API = "https://script.google.com/macros/s/AKfycbwlQGnAgMh6Mzd87TUyEVfXbSlnEwje32CUY6Q4ItsKIvIOsTIbD4TzODEHJn7mkhnK/exec";
const STORE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv";
const TITIPAN_ITEMS_URL = "https://docs.google.com/spreadsheets/d/1cUZWSumhePJLLocTMRE0-Q4BMC5bKgCyftOkVqC5BI0/export?format=csv";
const TITIPAN_ACCOUNTS_URL = "https://docs.google.com/spreadsheets/d/1sPZKHBNEooKSsD26usUfvOXX324lIghyHYd4R-gPDgY/export?format=csv";

export default function Page() {
  const [items, setItems] = useState([]);
  const [heroItems, setHeroItems] = useState([]); 
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);
  const [marketOpen, setMarketOpen] = useState(false);
  const [marketTab, setMarketTab] = useState("items");
  const [titipanItems, setTitipanItems] = useState([]);
  const [titipanAccounts, setTitipanAccounts] = useState([]);
  const [titipMenuOpen, setTitipMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ign, setIgn] = useState("");
  const [waNumber, setWaNumber] = useState(""); 
  const [auctionData, setAuctionData] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [isAuctionExpanded, setIsAuctionExpanded] = useState(false); 
  const [darkMode, setDarkMode] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const resStore = await fetch(STORE_SHEET_URL);
        const textStore = await resStore.text();
        parseStoreData(textStore);
        const resTItems = await fetch(TITIPAN_ITEMS_URL);
        const textTItems = await resTItems.text();
        parseTitipanItems(textTItems);
        const resTAcc = await fetch(TITIPAN_ACCOUNTS_URL);
        const textTAcc = await resTAcc.text();
        parseTitipanAccounts(textTAcc);
        const savedIgn = localStorage.getItem("gearShopIGN");
        if (savedIgn) setIgn(savedIgn);
        const savedWa = localStorage.getItem("gearShopWA");
        if (savedWa) setWaNumber(savedWa);
        const savedTheme = localStorage.getItem("gearShopTheme");
        if (savedTheme) setDarkMode(savedTheme === "dark");
      } catch (err) { console.error("Fetch error:", err); } finally { setLoading(false); }
    }
    loadData();
  }, []);

  const parseStoreData = (text) => {
    const rows = text.split(/\r?\n/).slice(1);
    const parsed = rows.filter(r => r.trim() !== "").map(r => {
      const c = r.split(",");
      const catRaw = c[0]?.trim() || "Uncategorized";
      if (catRaw.toUpperCase() === "#HERO") {
          return { kategori: "#HERO", nama: c[1]?.trim() || "Unknown", targetKategori: c[2]?.trim(), status: "System" };
      }
      return {
        kategori: catRaw, nama: c[1]?.trim() || "Unknown",
        buy: parseInt(c[2]?.replace(/\D/g, '')) || 0,
        sell: parseInt(c[3]?.replace(/\D/g, '')) || 0,
        status: c[4]?.trim() || "Kosong", promo: c[5]?.trim() || null
      };
    });
    const systemRow = parsed.find(item => item.kategori?.toUpperCase() === "#SYSTEM" && item.nama?.toUpperCase() === "STATUS_TOKO");
    setIsStoreOpen(!(systemRow && systemRow.status?.toUpperCase() === "TUTUP"));
    const heroRows = parsed.filter(item => item.kategori === "#HERO");
    const realItems = parsed.filter(item => item.kategori !== "#SYSTEM" && item.kategori !== "#HERO");
    const matchedHeroes = [];
    heroRows.forEach(h => {
        const found = realItems.find(item => item.nama.toLowerCase() === h.nama.toLowerCase() && item.kategori.toLowerCase() === h.targetKategori?.toLowerCase());
        if (found) matchedHeroes.push(found);
    });
    setHeroItems(matchedHeroes);
    setItems(realItems);
  };

  const parseTitipanItems = (text) => {
    const rows = text.split(/\r?\n/).slice(1);
    const data = rows.filter(r => r.trim() !== "").map(r => {
        const c = r.split(","); 
        return { nama: c[0]?.trim(), harga: c[1]?.trim(), owner: c[2]?.trim(), status: c[3]?.trim(), tipeHarga: c[4]?.trim(), img: c[5]?.trim() || null };
    });
    setTitipanItems(data);
  };

  const parseTitipanAccounts = (text) => {
    const rows = text.split(/\r?\n/).slice(1);
    const data = rows.filter(r => r.trim() !== "").map(r => {
        const c = r.split(",");
        return {
            nama: c[0]?.trim(), level: c[1]?.trim(), melee: c[2]?.trim(), dist: c[3]?.trim(), magic: c[4]?.trim(), def: c[5]?.trim(),
            setInfo: c[6]?.trim(), owner: c[7]?.trim(), status: c[8]?.trim(), tipeHarga: c[9]?.trim(), wajibMM: c[10]?.trim(),
            harga: c[11]?.trim(), img: c[12]?.trim() || null
        };
    });
    setTitipanAccounts(data);
  };
        useEffect(() => {
    fetchAuction(); 
    const interval = setInterval(fetchAuction, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!auctionData || !auctionData.endTime) return;
    const timer = setInterval(() => {
        const end = new Date(auctionData.endTime).getTime();
        const now = new Date().getTime();
        const distance = end - now;
        if (distance < 0) { setTimeLeft("LELANG DITUTUP"); } else {
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
        const res = await fetch(`${AUCTION_API}?t=${new Date().getTime()}`);
        const data = await res.json();
        setAuctionData(data);
    } catch (error) { console.error("Err lelang", error); }
  }

  const handleBid = async (action) => {
    if (!ign || !waNumber) { alert("Wajib isi IGN dan WA!"); setCartOpen(true); return; }
    const amount = action === "BIN" ? auctionData.binPrice : parseInt(bidAmount);
    if (action === "BIN" && auctionData.currentBid >= auctionData.binPrice) { alert("Sudah lewat BIN!"); return; }
    if (action === "BID" && (!amount || amount <= auctionData.currentBid)) { alert("Bid kekecilan!"); return; }
    if (!confirm(`Yakin mau ${action}?`)) return;
    setBidLoading(true);
    try {
        await fetch(AUCTION_API, { method: "POST", body: JSON.stringify({ action, bid: amount, ign, wa: waNumber }), headers: { "Content-Type": "text/plain" } });
        setBidAmount(""); setTimeout(fetchAuction, 1500); alert("Berhasil!");
    } catch (error) { alert("Gagal!"); } finally { setBidLoading(false); }
  };

  const toggleTheme = () => { const newM = !darkMode; setDarkMode(newM); localStorage.setItem("gearShopTheme", newM ? "dark" : "light"); };
  const formatGold = (val) => <span style={{ fontWeight: "bold", color: "#B8860B" }}>{val ? val.toLocaleString('id-ID') : 0} 🪙</span>;
  const statusLabel = s => {
    const v = s?.toLowerCase();
    if (v === "full") return "🟢 Full"; if (v === "ready") return "🔵 Ready";
    if (v === "take") return "🟡 Take"; if (v === "kosong") return "🔴 Kosong";
    return s;
  };

  const addToCart = (item, mode) => {
    const key = `${item.nama}-${item.kategori}-${mode}`;
    const exist = cart.find(c => c.key === key);
    if (exist) { setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c)); } 
    else { setCart([...cart, { ...item, mode, qty: 1, key }]); }
    setCartOpen(true);
  };
  const updateQty = (item, qty) => { if (qty < 1) return; setCart(cart.map(c => c.key === item.key ? { ...c, qty } : c)); };
  const removeFromCart = item => setCart(cart.filter(c => c.key !== item.key));
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + (c.mode === "buy" ? c.buy : c.sell) * c.qty, 0);

  const sendWA = () => {
    if (!cart.length || !ign) { alert("Isi IGN dulu!"); return; }
    const itemText = cart.map(c => `- ${c.nama} [${c.kategori}] (${c.mode.toUpperCase()}) x${c.qty} = ${((c.mode === 'buy' ? c.buy : c.sell) * c.qty).toLocaleString('id-ID')}`).join("%0A");
    const message = `Halo,%20saya%20*${encodeURIComponent(ign)}*%20mau%20order:%0A${itemText}%0A%0ATotal:%20${totalPrice.toLocaleString('id-ID')}%20Gold`;
    window.open(`https://wa.me/6283101456267?text=${message}`, "_blank");
  };

  const contactAdmin = () => window.open("https://wa.me/6283101456267?text=Halo%20Admin.", "_blank");
  const contactOwner = (item, type) => {
    const text = type === 'account' ? `Minat akun: *${item.nama}*` : `Minat item: *${item.nama}*`;
    window.open(`https://wa.me/6283101456267?text=${encodeURIComponent(text)}`, "_blank");
  };

  const categories = ["All", ...new Set(items.map(i => i.kategori))];
  const filteredItems = items.filter(i => (i.nama.toLowerCase().includes(search.toLowerCase())) && (category === "All" || i.kategori === category));

  const theme = { bg: darkMode ? "#121212" : "#f5f5f5", text: darkMode ? "#e0e0e0" : "#333", cardBg: darkMode ? "#1e1e1e" : "#fff", border: darkMode ? "1px solid #333" : "1px solid #ddd", modalBg: darkMode ? "#222" : "#fff", accent: "#B8860B", inputBg: darkMode ? "#2c2c2c" : "#fff", subText: darkMode ? "#aaa" : "#666", auctionBg: darkMode ? "linear-gradient(135deg, #2c0000 0%, #4a0000 100%)" : "linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%)" };
  const styles = {
      header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#1e293b", color: "#fff", position: "sticky", top: 0, zIndex: 100 },
      grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 },
      card: { background: theme.cardBg, border: theme.border, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 },
      input: { width: "100%", padding: 10, borderRadius: 6, border: theme.border, background: theme.inputBg, color: theme.text, marginBottom: 10 },
      btn: { background: theme.accent, color: "#fff", border: "none", padding: "8px", borderRadius: 4, cursor: "pointer", fontWeight: "bold" },
      modalOverlay: { position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", justifyContent: "center", alignItems: "end" }
  };

  if (!loading && !isStoreOpen) {
    return ( <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}><h2>🔴 TOKO TUTUP</h2><button onClick={contactAdmin} style={{ background: "#25D366", color: "#fff", padding: "12px 24px", borderRadius: 50 }}>Chat Admin</button></div> );
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "sans-serif", paddingBottom: 80 }}>
      <header style={styles.header}>
        <img src="/logo.png" height={36} alt="Logo" />
        <div style={{display:"flex", gap: 15}}>
            <div onClick={() => setMarketOpen(true)} style={{fontSize: 22, cursor:"pointer"}}>🏪</div>
            <div onClick={toggleTheme} style={{fontSize: 20, cursor:"pointer"}}>{darkMode ? "☀️" : "🌙"}</div>
            <div onClick={() => setCartOpen(true)} style={{position: "relative", fontSize: 24, cursor:"pointer"}}>🛒{cart.length > 0 && <span style={{position:"absolute", top:-5, right:-8, background:"red", color:"white", borderRadius:"50%", width:18, height:18, fontSize:11, display:"flex", justifyContent:"center", alignItems:"center"}}>{totalQty}</span>}</div>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        {/* LELANG SECTION */}
        {auctionData && auctionData.status !== "empty" && (
          <div style={{ marginBottom: 24, borderRadius: 12, border: "2px solid #FF4444", background: theme.auctionBg }}>
            <div onClick={() => setIsAuctionExpanded(!isAuctionExpanded)} style={{ padding: 12, background: "#880000", color: "white", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
              <span>🔨 Live Auction {isAuctionExpanded ? "▼" : "▶"}</span>
              <span style={{fontFamily:"monospace"}}>{timeLeft}</span>
            </div>
            {isAuctionExpanded && (
              <div style={{ padding: 16, textAlign:"center" }}>
                <strong>{auctionData.item}</strong>
                <div style={{fontSize: 28, color: "#25D366"}}>{formatGold(auctionData.currentBid)}</div>
                {!auctionData.isEnded && (
                  <div style={{display:"flex", gap: 8, marginTop: 15}}>
                    <input type="number" placeholder="Nominal..." value={bidAmount} onChange={e => setBidAmount(e.target.value)} style={{...styles.input, marginBottom:0}} />
                    <button onClick={() => handleBid("BID")} style={styles.btn}>BID</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HERO ITEMS */}
        {heroItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3>🔥 Hot Items</h3>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10 }}>
               {heroItems.map((item, idx) => {
                 const status = item.status?.toLowerCase();
                 const showBuy = (status === "ready" || status === "full") && item.buy > 0;
                 return (
                   <div key={idx} style={{ minWidth: 140, background: theme.cardBg, border: theme.border, borderRadius: 8, padding: 10, opacity: status === 'kosong' ? 0.6 : 1 }}>
                      <div style={{fontWeight: "bold", color: "#FFD700"}}>{item.nama}</div>
                      <div style={{fontSize: 10, color: theme.subText}}>({item.targetKategori || item.kategori})</div>
                      <div style={{fontSize: 11}}>{statusLabel(item.status)}</div>
                      {showBuy && <button onClick={() => addToCart(item, 'buy')} style={{...styles.btn, fontSize: 11, width: "100%", marginTop:5}}>Beli {(item.buy/1000)}k</button>}
                   </div>
                 )
               })}
            </div>
          </div>
        )}

        {/* FILTERS & LIST */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto" }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: "8px 16px", borderRadius: 20, background: category === c ? theme.accent : theme.cardBg, color: category === c ? "#fff" : theme.text, border: "none" }}>{c}</button>
          ))}
        </div>
        <input placeholder="Cari item..." value={search} onChange={e => setSearch(e.target.value)} style={styles.input} />

        <div style={styles.grid}>
          {filteredItems.map((item, idx) => {
            const status = item.status?.toLowerCase();
            const showBuy = (status === "ready" || status === "full") && item.buy > 0;
            const showSell = (status === "ready" || status === "take") && item.sell > 0;
            return (
              <div key={idx} style={{...styles.card, opacity: status === 'kosong' ? 0.6 : 1}}>
                <div style={{fontWeight: "bold", color: "#FFD700"}}>{item.nama} <span style={{fontSize: 10, display:"block", color: theme.subText}}>({item.kategori})</span></div>
                <div style={{fontSize: 12}}>{statusLabel(item.status)}</div>
                <div style={{marginTop: "auto"}}>
                   {showBuy && <button onClick={() => addToCart(item, 'buy')} style={{...styles.btn, width: "100%", marginBottom: 4}}>Beli {item.buy.toLocaleString('id-ID')}</button>}
                   {showSell && <button onClick={() => addToCart(item, 'sell')} style={{...styles.btn, width: "100%", background: "#333", border: "1px solid #555"}}>Jual {item.sell.toLocaleString('id-ID')}</button>}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODALS (Simplified for Copy) */}
      {cartOpen && (
        <div onClick={(e) => e.target === e.currentTarget && setCartOpen(false)} style={styles.modalOverlay}>
           <div style={{ width: "85%", background: theme.modalBg, height: "90vh", padding: 20, overflowY: "auto", borderTopLeftRadius: 16 }}>
              <h2>Keranjang</h2>
              {cart.map(c => (
                  <div key={c.key} style={{borderBottom: "1px solid #333", padding: "10px 0"}}>
                      <div>{c.nama} <span style={{fontSize:11, color: theme.subText}}>[{c.kategori}]</span></div>
                      <div style={{display:"flex", justifyContent:"space-between", marginTop: 5}}>
                          <span>{c.qty}x @{c.mode.toUpperCase()}</span>
                          <button onClick={() => removeFromCart(c)} style={{background:"red", color:"white", border:"none", padding:"2px 8px"}}>✕</button>
                      </div>
                  </div>
              ))}
              <div style={{marginTop: 20}}>
                  <input placeholder="IGN (Nickname) *" value={ign} onChange={(e) => {setIgn(e.target.value); localStorage.setItem("gearShopIGN", e.target.value)}} style={styles.input} />
                  <div style={{fontSize: 18, fontWeight:"bold", margin: "10px 0"}}>Total: {totalPrice.toLocaleString('id-ID')} 🪙</div>
                  <button onClick={sendWA} style={{...styles.btn, width: "100%", background: "#25D366", padding: 15}}>Checkout WhatsApp 🚀</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
        }
