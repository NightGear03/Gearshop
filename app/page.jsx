"use client";

import { useEffect, useState } from "react";

// === CONFIG URL ===
const AUCTION_API = "https://script.google.com/macros/s/AKfycbwlQGnAgMh6Mzd87TUyEVfXbSlnEwje32CUY6Q4ItsKIvIOsTIbD4TzODEHJn7mkhnK/exec";
const STORE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv";

// URL TITIPAN
const TITIPAN_ITEMS_URL = "https://docs.google.com/spreadsheets/d/1cUZWSumhePJLLocTMRE0-Q4BMC5bKgCyftOkVqC5BI0/export?format=csv";
const TITIPAN_ACCOUNTS_URL = "https://docs.google.com/spreadsheets/d/1sPZKHBNEooKSsD26usUfvOXX324lIghyHYd4R-gPDgY/export?format=csv";

export default function Page() {
  /* ===== STATE DATA STORE ===== */
  const [items, setItems] = useState([]);
  const [heroItems, setHeroItems] = useState([]); 
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);

  /* ===== STATE MARKET TITIPAN ===== */
  const [marketOpen, setMarketOpen] = useState(false);
  const [marketTab, setMarketTab] = useState("items");
  const [titipanItems, setTitipanItems] = useState([]);
  const [titipanAccounts, setTitipanAccounts] = useState([]);
  const [titipMenuOpen, setTitipMenuOpen] = useState(false);

  /* ===== STATE CART & USER ===== */
  const [cart, setCart] = useState([]);
  const [cartOpen, setWaitCartOpen] = useState(false);
  const [ign, setIgn] = useState("");
  const [waNumber, setWaNumber] = useState(""); 

  /* ===== STATE AUCTION (LELANG) ===== */
  const [auctionData, setAuctionData] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [isAuctionExpanded, setIsAuctionExpanded] = useState(false); 

  /* ===== STATE DARK MODE & STORE STATUS ===== */
  const [darkMode, setDarkMode] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  /* ===== LOAD ALL DATA ===== */
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

      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
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
        if (distance < 0) { setTimeLeft("LELANG DITUTUP"); } 
        else {
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
    if (!ign || (action === "BID" || action === "BIN" ? !waNumber : false)) {
        alert("Wajib isi IGN dan No WA dulu di keranjang untuk ikut Lelang!");
        setWaitCartOpen(true);
        return;
    }
    const amount = action === "BIN" ? auctionData.binPrice : parseInt(bidAmount);
    if (action === "BID") {
        if (!amount || amount <= auctionData.currentBid) {
            alert(`Bid harus lebih tinggi dari ${auctionData.currentBid.toLocaleString()}`);
            return;
        }
        // Anti-Rusuh: Cek kenaikan wajar (misal tidak boleh loncat lebih dari 5x lipat bid sekarang)
        if (amount > (auctionData.currentBid * 5) && auctionData.currentBid > 0) {
            alert("Bid tidak wajar (terlalu tinggi)! Masukkan nominal yang masuk akal.");
            return;
        }
    }
    if (!confirm(`Yakin mau ${action} seharga ${amount.toLocaleString()}?`)) return;
    setBidLoading(true);
    try {
        await fetch(AUCTION_API, {
            method: "POST",
            mode: 'no-cors',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, bid: amount, ign, wa: waNumber })
        });
        setBidAmount("");
        setTimeout(fetchAuction, 2000); 
        alert("Bid Terkirim! Mohon tunggu update data.");
    } catch (error) { alert("Gagal kirim bid."); } 
    finally { setBidLoading(false); }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("gearShopTheme", newMode ? "dark" : "light");
  };

  const formatGold = (val) => <span style={{ fontWeight: "bold", color: "#B8860B" }}>{val ? val.toLocaleString('id-ID') : 0} 🪙</span>;
  const statusLabel = s => {
    const v = s?.toLowerCase();
    if (v === "full") return "🟢 Full";
    if (v === "ready") return "🔵 Ready";
    if (v === "take") return "🟡 Take";
    if (v === "kosong") return "🔴 Kosong";
    return s;
  };

  const addToCart = (item, mode) => {
    if (item.status?.toLowerCase() === "kosong") return;
    const key = `${item.nama}-${mode}`;
    const exist = cart.find(c => c.key === key);
    if (exist) { setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c)); } 
    else { setCart([...cart, { ...item, mode, qty: 1, key }]); }
    setWaitCartOpen(true);
  };
  const updateQty = (item, qty) => { if (qty < 1) return; setCart(cart.map(c => c.key === item.key ? { ...c, qty } : c)); };
  const removeFromCart = item => setCart(cart.filter(c => c.key !== item.key));
  const totalPrice = cart.reduce((s, c) => s + (c.mode === "buy" ? c.buy : c.sell) * c.qty, 0);

  const sendWA = () => {
    if (!cart.length) return;
    if (!ign) { alert("Wajib isi IGN!"); return; }
    const itemText = cart.map(c => `${c.nama} (${c.mode}) x${c.qty}`).join("%0A");
    const message = `Halo,%20saya%20*${encodeURIComponent(ign)}*%20mau%20order:%0A${itemText}%0A%0ATotal:%20${totalPrice.toLocaleString('id-ID')}%20Gold`;
    window.open(`https://wa.me/6283101456267?text=${message}`, "_blank");
  };

  const contactAdmin = () => window.open("https://wa.me/6283101456267?text=Halo%20Admin", "_blank");
  const contactOwner = (item, type) => {
    const text = type === 'account' ? `Halo Admin, minat akun: *${item.nama}*` : `Halo Admin, minat item: *${item.nama}*`;
    window.open(`https://wa.me/6283101456267?text=${encodeURIComponent(text)}`, "_blank");
  };
  const titipJualWA = (type) => {
      let text = type === 'item' ? "Halo Admin, mau titip ITEM" : "Halo Admin, mau titip AKUN";
      window.open(`https://wa.me/6283101456267?text=${encodeURIComponent(text)}`, "_blank");
  };

  const categories = ["All", ...new Set(items.map(i => i.kategori))];
  const filteredItems = items.filter(i => (i.nama.toLowerCase().includes(search.toLowerCase())) && (category === "All" || i.kategori === category));

  const theme = {
    bg: darkMode ? "#121212" : "#f5f5f5", text: darkMode ? "#e0e0e0" : "#333", cardBg: darkMode ? "#1e1e1e" : "#fff",
    border: darkMode ? "1px solid #333" : "1px solid #ddd", modalBg: darkMode ? "#222" : "#fff", accent: "#B8860B",
    inputBg: darkMode ? "#2c2c2c" : "#fff", subText: darkMode ? "#aaa" : "#666",
    auctionBg: darkMode ? "linear-gradient(135deg, #2c0000 0%, #4a0000 100%)" : "linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%)",
  };

  const styles = {
      header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#1e293b", color: "#fff", borderBottom: theme.border, position: "sticky", top: 0, zIndex: 100 },
      grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 },
      card: { background: theme.cardBg, border: theme.border, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 },
      input: { width: "100%", padding: 10, borderRadius: 6, border: theme.border, background: theme.inputBg, color: theme.text, marginBottom: 10, outline: "none" },
      btn: { background: theme.accent, color: "#fff", border: "none", padding: "8px", borderRadius: 4, cursor: "pointer", fontWeight: "bold" },
      modalOverlay: { position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "end" }, 
      modalContent: { background: theme.modalBg, width: "100%", height: "90vh", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, overflowY: "auto" },
      fab: { position: "fixed", bottom: 30, right: 30, background: "#25D366", color: "white", width: 56, height: 56, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 30, zIndex: 201 },
  };

  const MarketModal = () => (
      <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setMarketOpen(false)}>
          <div style={styles.modalContent}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom: 20}}>
                  <h2 style={{margin:0}}>🏪 Pasar Warga</h2>
                  <button onClick={()=>setMarketOpen(false)} style={{background:"transparent", border:"none", color: theme.text, fontSize: 24}}>✕</button>
              </div>
              <div style={{display:"flex", gap:10, marginBottom:20}}>
                  <button onClick={()=>setMarketTab('items')} style={{flex:1, padding:10, borderRadius:8, background: marketTab==='items'?theme.accent:'transparent', color: marketTab==='items'?'#fff':theme.text, border:theme.border}}>⚔️ ITEM</button>
                  <button onClick={()=>setMarketTab('accounts')} style={{flex:1, padding:10, borderRadius:8, background: marketTab==='accounts'?theme.accent:'transparent', color: marketTab==='accounts'?'#fff':theme.text, border:theme.border}}>👤 AKUN</button>
              </div>
              <div style={marketTab === 'items' ? styles.grid : {display:"grid", gridTemplateColumns:"1fr", gap:12}}>
                  {marketTab === 'items' ? (
                      titipanItems.length > 0 ? titipanItems.map((item, idx) => (
                        <div key={idx} style={styles.card}>
                            <div style={{fontWeight:"bold", color:"#FFD700"}}>{item.nama}</div>
                            <div style={{fontSize:12}}>By: {item.owner} | {item.harga}</div>
                            <button onClick={()=>contactOwner(item, 'item')} style={{...styles.btn, marginTop:8}}>Nego</button>
                        </div>
                      )) : <div style={{textAlign:"center", color:theme.subText, gridColumn:"1/-1", padding:40}}>Belum ada barang titipan saat ini 🤷‍♂️</div>
                  ) : (
                      titipanAccounts.length > 0 ? titipanAccounts.map((acc, idx) => (
                        <div key={idx} style={{...styles.card, flexDirection:"row", gap:12}}>
                            <div style={{flex:1}}>
                                <div style={{fontWeight:"bold", color:"#FFD700"}}>{acc.nama} (Lv.{acc.level})</div>
                                <div style={{fontSize:11, color:theme.subText}}>MM: {acc.wajibMM} | Set: {acc.setInfo}</div>
                                <div style={{fontSize:12, fontWeight:"bold", marginTop:4}}>{acc.harga} ({acc.tipeHarga})</div>
                                <button onClick={()=>contactOwner(acc, 'account')} style={{...styles.btn, marginTop:8, width:"100%"}}>Nego Akun</button>
                            </div>
                        </div>
                      )) : <div style={{textAlign:"center", color:theme.subText, padding:40}}>Belum ada akun titipan saat ini 🕵️</div>
                  )}
              </div>
              <div style={styles.fab} onClick={() => setTitipMenuOpen(!titipMenuOpen)}>{titipMenuOpen ? "✕" : "+"}</div>
              {titipMenuOpen && (
                  <div style={{position:"fixed", bottom:95, right:30, display:"flex", flexDirection:"column", gap:10, zIndex:201}}>
                      <button onClick={()=>titipJualWA('account')} style={{padding:"10px 20px", borderRadius:20, border:"none", background:"#fff", fontWeight:"bold", boxShadow:"0 4px 10px rgba(0,0,0,0.3)"}}>👤 Titip Akun</button>
                      <button onClick={()=>titipJualWA('item')} style={{padding:"10px 20px", borderRadius:20, border:"none", background:"#fff", fontWeight:"bold", boxShadow:"0 4px 10px rgba(0,0,0,0.3)"}}>⚔️ Titip Item</button>
                  </div>
              )}
          </div>
      </div>
  );

  if (!loading && !isStoreOpen) {
    return (
      <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
        <h2 style={{color: "#FF4444"}}>🔴 TOKO TUTUP</h2>
        <button onClick={contactAdmin} style={{ background: "#25D366", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 50, fontWeight: "bold", marginTop:20 }}>Chat Admin</button>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "sans-serif", paddingBottom: 80 }}>
      <header style={styles.header}>
        <img src="/logo.png" height={36} alt="Logo" />
        <div style={{display:"flex", gap: 15, alignItems:"center"}}>
            <div style={{cursor:"pointer", fontSize: 22}} onClick={() => setMarketOpen(true)}>🏪</div>
            <div style={{cursor:"pointer", fontSize: 20}} onClick={toggleTheme}>{darkMode ? "☀️" : "🌙"}</div>
            <div style={{position:"relative", fontSize:24, cursor:"pointer"}} onClick={() => setWaitCartOpen(true)}>🛒
                {cart.length > 0 && <span style={{position:"absolute", top:-5, right:-8, background:"red", color:"white", borderRadius:"50%", width:18, height:18, fontSize:11, display:"flex", justifyContent:"center", alignItems:"center"}}>{cart.length}</span>}
            </div>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        {auctionData && auctionData.status !== "empty" && (
        <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", border: "2px solid #FF4444", background: theme.auctionBg }}>
            <div onClick={() => setIsAuctionExpanded(!isAuctionExpanded)} style={{ padding: "12px 16px", background: "#aa0000", color: "white", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
              <span>🔨 Live Auction {isAuctionExpanded ? "▼" : "▶"}</span>
              <span style={{fontFamily:"monospace"}}>{timeLeft}</span>
            </div>
            {isAuctionExpanded && (
            <div style={{ padding: 16, textAlign:"center" }}>
                <strong style={{fontSize: 22}}>{auctionData.item}</strong>
                <div style={{fontSize: 32, fontWeight:"bold", color: "#25D366", margin: "10px 0"}}>{formatGold(auctionData.currentBid)}</div>
                {auctionData.leaderboard && (
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 10, textAlign: "left", marginBottom: 15 }}>
                        {auctionData.leaderboard.slice(0,3).map((l, i) => (
                            <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom: "1px solid rgba(255,255,255,0.1)"}}>
                                <span>{i===0?"🥇":i===1?"🥈":"🥉"} {l.name}</span>
                                <span style={{color:"#25D366"}}>{l.bid.toLocaleString()} 🪙</span>
                            </div>
                        ))}
                    </div>
                )}
                {!auctionData.isEnded && (
                    <div style={{display:"flex", flexDirection:"column", gap:10}}>
                        <div style={{display:"flex", gap:8}}>
                            <input type="number" placeholder="Nominal Bid..." value={bidAmount} onChange={e => setBidAmount(e.target.value)} style={{...styles.input, flex:1, marginBottom:0}} />
                            <button onClick={() => handleBid("BID")} disabled={bidLoading} style={{...styles.btn, padding:"0 20px"}}>BID</button>
                        </div>
                        {/* Tampilan BIN di bawah BID */}
                        <div style={{borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:10}}>
                           {auctionData.currentBid < auctionData.binPrice ? (
                               <button onClick={() => handleBid("BIN")} disabled={bidLoading} style={{...styles.btn, width:"100%", background:"#FFD700", color:"#000"}}>
                                   ⚡ BUY IT NOW (BIN): {auctionData.binPrice.toLocaleString()} 🪙
                               </button>
                           ) : (
                               <button disabled style={{...styles.btn, width:"100%", background:"#555", color:"#ccc", cursor:"not-allowed"}}>
                                   ❌ BIN CLOSED (Bid reached limit)
                               </button>
                           )}
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
        )}

        {heroItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginLeft: 8 }}>🔥 Hot Items</h3>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10 }}>
               {heroItems.map((item, idx) => (
                 <div key={idx} style={{ minWidth: 140, background: theme.cardBg, border: theme.border, borderRadius: 8, padding: 10 }}>
                    <div style={{fontWeight: "bold", color: "#FFD700"}}>{item.nama}</div>
                    <div style={{fontSize:10, color:theme.subText}}>({item.targetKategori})</div>
                    <div style={{fontSize: 11, margin:"4px 0"}}>{statusLabel(item.status)}</div>
                    <button onClick={() => addToCart(item, 'buy')} disabled={item.status === 'Kosong'} style={{...styles.btn, width:"100%", fontSize:11}}>Beli {(item.buy/1000)}k</button>
                 </div>
               ))}
            </div>
          </div>
        )}

        <input placeholder="Cari item..." value={search} onChange={e => setSearch(e.target.value)} style={styles.input} />

        <div style={styles.grid}>
          {filteredItems.map((item, idx) => (
            <div key={idx} style={styles.card}>
              <div style={{fontWeight: "bold", color: "#FFD700"}}>{item.nama} <span style={{fontSize:10, color:theme.subText, fontWeight:"normal"}}>({item.kategori})</span></div>
              <div style={{fontSize: 12}}>{statusLabel(item.status)}</div>
              <div style={{marginTop: "auto", display:"flex", flexDirection:"column", gap:4}}>
                 {item.buy > 0 && <button onClick={() => addToCart(item, 'buy')} disabled={item.status === 'Kosong'} style={styles.btn}>Beli {item.buy.toLocaleString()}</button>}
                 {item.sell > 0 && <button onClick={() => addToCart(item, 'sell')} style={{...styles.btn, background: "#333"}}>Jual {item.sell.toLocaleString()}</button>}
              </div>
            </div>
          ))}
        </div>
      </main>

      {marketOpen && <MarketModal />}

      {cartOpen && (
        <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setWaitCartOpen(false)}>
           <div style={{ ...styles.modalContent, width: "70%", maxWidth: 320, cursor: "default" }} onClick={(e)=>e.stopPropagation()}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
                  <h2 style={{margin:0}}>Keranjang</h2>
                  <button onClick={() => setWaitCartOpen(false)} style={{background:"transparent", border:"none", color: theme.text, fontSize: 24}}>✕</button>
              </div>
              {cart.map(c => (
                  <div key={c.key} style={{marginBottom: 15, borderBottom: "1px solid #333", paddingBottom:10}}>
                      <div style={{fontWeight:"bold"}}>{c.nama} ({c.mode})</div>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 8}}>
                          <div>{formatGold(c.mode === 'buy' ? c.buy : c.sell)} x {c.qty}</div>
                          <div style={{display:"flex", gap: 10}}>
                              <button onClick={() => updateQty(c, c.qty - 1)}>-</button>
                              <button onClick={() => updateQty(c, c.qty + 1)}>+</button>
                              <button onClick={() => removeFromCart(c)} style={{background:"red", border:"none", borderRadius:4, color:"#fff", padding:"2px 8px"}}>X</button>
                          </div>
                      </div>
                  </div>
              ))}
              <div style={{marginTop: 20}}>
                  <input placeholder="Nickname Game (IGN) *" value={ign} onChange={(e) => {setIgn(e.target.value); localStorage.setItem("gearShopIGN", e.target.value)}} style={styles.input} />
                  <input placeholder="Nomor WA (Hanya untuk Lelang)" type="tel" value={waNumber} onChange={(e) => {setWaNumber(e.target.value); localStorage.setItem("gearShopWA", e.target.value)}} style={styles.input} />
                  <div style={{display:"flex", justifyContent:"space-between", fontWeight:"bold", margin:"10px 0"}}>
                      <span>Total:</span><span>{totalPrice.toLocaleString()} Gold</span>
                  </div>
                  <button onClick={sendWA} style={{...styles.btn, width: "100%", background: "#25D366", padding: 15}}>WhatsApp Checkout 🚀</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
