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
  const [cartOpen, setCartOpen] = useState(false);
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

  // -- Parser Toko Utama --
  const parseStoreData = (text) => {
    const rows = text.split(/\r?\n/).slice(1);
    const parsed = rows.filter(r => r.trim() !== "").map(r => {
      const c = r.split(",");
      const catRaw = c[0]?.trim() || "Uncategorized";
      
      if (catRaw.toUpperCase() === "#HERO") {
          return { kategori: "#HERO", nama: c[1]?.trim() || "Unknown", targetKategori: c[2]?.trim(), status: "System" };
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

  // -- Parser Titipan Items --
  const parseTitipanItems = (text) => {
    const rows = text.split(/\r?\n/).slice(1);
    const data = rows.filter(r => r.trim() !== "").map(r => {
        const c = r.split(","); 
        return {
            nama: c[0]?.trim(), harga: c[1]?.trim(), owner: c[2]?.trim(), status: c[3]?.trim(), tipeHarga: c[4]?.trim(), img: c[5]?.trim() || null
        };
    });
    setTitipanItems(data);
  };

  // -- Parser Titipan Accounts --
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

  /* ===== LOAD DATA AUCTION ===== */
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
        const res = await fetch(`${AUCTION_API}?t=${new Date().getTime()}`);
        const data = await res.json();
        setAuctionData(data);
    } catch (error) { console.error("Err lelang", error); }
  }

  /* ===== ACTION HANDLERS (UPDATED) ===== */
  const handleBid = async (action) => {
    // 1. Validasi IGN & WA (Wajib untuk Lelang)
    if (!ign || !waNumber) {
        alert("Untuk ikut lelang, WAJIB isi IGN dan Nomor WA di keranjang!");
        setCartOpen(true);
        return;
    }

    const amount = action === "BIN" ? auctionData.binPrice : parseInt(bidAmount);

    // 2. Logic BIN Padam jika Bid > BIN
    if (action === "BIN" && auctionData.currentBid >= auctionData.binPrice) {
        alert("Maaf bang, harga Bid sudah melewati harga BIN. Silahkan Bid manual.");
        return;
    }

    // 3. Logic Bid Dasar
    if (action === "BID" && (!amount || amount <= auctionData.currentBid)) {
        alert(`Bid harus lebih tinggi dari ${formatGold(auctionData.currentBid + auctionData.increment)}`);
        return;
    }

    // 4. Anti-Troll Logic (Max Jump 2x lipat)
    if (action === "BID" && amount > (auctionData.currentBid * 2)) {
         if(!confirm(`Yakin bid ${formatGold(amount)}? Ini jauh banget dari bid sekarang lho.`)) return;
    }

    if (!confirm(`Yakin mau ${action} seharga ${amount}?`)) return;
    
    setBidLoading(true);
    try {
        await fetch(AUCTION_API, {
            method: "POST",
            body: JSON.stringify({ action, bid: amount, ign, wa: waNumber }),
            headers: { "Content-Type": "text/plain" }
        });
        setBidAmount("");
        setTimeout(fetchAuction, 1500); 
        alert("Permintaan dikirim!");
    } catch (error) { alert("Gagal kirim bid."); } 
    finally { setBidLoading(false); }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("gearShopTheme", newMode ? "dark" : "light");
  };

  /* ===== HELPERS ===== */
  const formatGold = (val) => <span style={{ fontWeight: "bold", color: "#B8860B" }}>{val ? val.toLocaleString('id-ID') : 0} 🪙</span>;
  
  const statusLabel = s => {
    const v = s?.toLowerCase();
    if (v === "full") return "🟢 Full";
    if (v === "ready") return "🔵 Ready";
    if (v === "take") return "🟡 Take";
    if (v === "kosong") return "🔴 Kosong";
    return s;
  };

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
  const removeFromCart = item => setCart(cart.filter(c => c.key !== item.key));
  
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + (c.mode === "buy" ? c.buy : c.sell) * c.qty, 0);

  // FIX: Checkout WA (Cuma Wajib IGN, No WA gak dikirim)
  const sendWA = () => {
    if (!cart.length) return;
    if (!ign) {
        alert("Mohon isi IGN (Nickname Game) dulu ya!");
        return;
    }
    const itemText = cart.map(c => `${c.nama} (${c.mode}) x${c.qty} = ${(c.mode === 'buy' ? c.buy : c.sell) * c.qty}`).join("%0A");
    const message = `Halo,%20saya%20*${encodeURIComponent(ign)}*%20mau%20order:%0A${itemText}%0A%0ATotal:%20${totalPrice.toLocaleString('id-ID')}%20Gold`;
    window.open(`https://wa.me/6283101456267?text=${message}`, "_blank");
  };

  const contactAdmin = () => window.open("https://wa.me/6283101456267?text=Halo%20Admin,%20mau%20tanya-tanya%20dong.", "_blank");
  const contactOwner = (item, type) => {
    const text = type === 'account' 
       ? `Halo Admin, saya minat akun titipan: *${item.nama}* (Owner: ${item.owner}) seharga ${item.harga}. Status: ${item.status}`
       : `Halo Admin, saya minat barang titipan: *${item.nama}* (Owner: ${item.owner}) seharga ${item.harga}.`;
    window.open(`https://wa.me/6283101456267?text=${encodeURIComponent(text)}`, "_blank");
  };
  const titipJualWA = (type) => {
      let text = type === 'item' 
        ? "Halo Admin, mau titip jual ITEM.\n\nNama Item:\nHarga:\nNego/Fix:\nScreenshot:"
        : "Halo Admin, mau titip jual AKUN.\n\nNama/Job:\nLevel:\nStat Melee/Dist/Mag/Def:\nInfo Set:\nHarga:\nNego/Fix:\nWajib MM:\nScreenshot Char:";
      window.open(`https://wa.me/6283101456267?text=${encodeURIComponent(text)}`, "_blank");
  };

  /* ===== FILTERING ===== */
  const categories = ["All", ...new Set(items.map(i => i.kategori))];
  const filteredItems = items.filter(i => {
      return (i.nama.toLowerCase().includes(search.toLowerCase())) && (category === "All" || i.kategori === category);
    }).sort((a, b) => sort === "buy-asc" ? a.buy - b.buy : sort === "buy-desc" ? b.buy - a.buy : 0);

  /* ===== STYLES ===== */
  const theme = {
    bg: darkMode ? "#121212" : "#f5f5f5",
    text: darkMode ? "#e0e0e0" : "#333",
    cardBg: darkMode ? "#1e1e1e" : "#fff",
    border: darkMode ? "1px solid #333" : "1px solid #ddd",
    modalBg: darkMode ? "#222" : "#fff",
    accent: "#B8860B",
    inputBg: darkMode ? "#2c2c2c" : "#fff",
    subText: darkMode ? "#aaa" : "#666",
    auctionBg: darkMode ? "linear-gradient(135deg, #2c0000 0%, #4a0000 100%)" : "linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%)",
  };

  const styles = {
      header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#1e293b", color: "#fff", borderBottom: theme.border, position: "sticky", top: 0, zIndex: 100 },
      cartIcon: { position: "relative", fontSize: 24, cursor: "pointer" },
      cartBadge: { position: "absolute", top: -5, right: -8, background: "red", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", justifyContent: "center", alignItems: "center" },
      grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 },
      card: { background: theme.cardBg, border: theme.border, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 },
      input: { width: "100%", padding: 10, borderRadius: 6, border: theme.border, background: theme.inputBg, color: theme.text, marginBottom: 10, outline: "none" },
      btn: { background: theme.accent, color: "#fff", border: "none", padding: "8px", borderRadius: 4, cursor: "pointer", fontWeight: "bold" },
      modalOverlay: { position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "end" }, 
      modalContent: { background: theme.modalBg, width: "100%", height: "90vh", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, overflowY: "auto", position: "relative" },
      tabContainer: { display: "flex", gap: 10, marginBottom: 20, borderBottom: theme.border, paddingBottom: 10 },
      tabBtn: (active) => ({ flex: 1, padding: 10, borderRadius: 8, background: active ? theme.accent : "transparent", color: active ? "#fff" : theme.text, border: active ? "none" : theme.border, cursor: "pointer", fontWeight: "bold", textAlign: "center" }),
      fab: { position: "fixed", bottom: 30, right: 30, background: "#25D366", color: "white", width: 56, height: 56, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 30, boxShadow: "0 4px 10px rgba(0,0,0,0.3)", cursor: "pointer", zIndex: 201 },
      fabMenu: { position: "fixed", bottom: 95, right: 30, display: "flex", flexDirection: "column", gap: 10, zIndex: 201 }
  };

  /* ===== MARKET MODAL ===== */
  const MarketModal = () => (
      <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom: 20}}>
                  <h2 style={{margin:0}}>🏪 Pasar Warga</h2>
                  <button onClick={()=>setMarketOpen(false)} style={{background:"transparent", border:"none", color: theme.text, fontSize: 24}}>✕</button>
              </div>
              <div style={styles.tabContainer}>
                  <button style={styles.tabBtn(marketTab === 'items')} onClick={()=>setMarketTab('items')}>⚔️ ITEM</button>
                  <button style={styles.tabBtn(marketTab === 'accounts')} onClick={()=>setMarketTab('accounts')}>👤 AKUN</button>
              </div>
              <div style={marketTab === 'items' ? styles.grid : {...styles.grid, gridTemplateColumns: "1fr"}}>
                  {marketTab === 'items' && titipanItems.map((item, idx) => (
                      <div key={idx} style={{...styles.card, position: "relative", opacity: item.status?.toLowerCase() === 'sold' ? 0.6 : 1}}>
                          {item.status?.toLowerCase() === 'sold' && <div style={{position:"absolute", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", color:"red", fontWeight:"bold", fontSize:20, zIndex:2}}>SOLD</div>}
                          <div style={{height: 100, background: "#333", borderRadius: 4, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden"}}>
                              {item.img ? <img src={item.img} alt={item.nama} style={{width:"100%", height:"100%", objectFit:"cover"}}/> : <span style={{fontSize:40}}>📦</span>}
                          </div>
                          <div style={{fontWeight:"bold", color: "#FFD700", fontSize: 14}}>{item.nama}</div>
                          <div style={{fontSize: 12, color: theme.text}}>By: {item.owner}</div>
                          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 4}}>
                              <span style={{color: "#4caf50", fontWeight:"bold"}}>{item.harga}</span>
                              <span style={{fontSize: 10, padding: "2px 6px", borderRadius: 4, background: item.tipeHarga === 'Nego' ? '#FFA500' : '#2196F3', color:'white'}}>{item.tipeHarga}</span>
                          </div>
                          <button onClick={()=>contactOwner(item, 'item')} style={{...styles.btn, marginTop:8, fontSize: 12}}>💬 Chat Owner</button>
                      </div>
                  ))}
                  {marketTab === 'accounts' && titipanAccounts.map((acc, idx) => (
                      <div key={idx} style={{...styles.card, flexDirection: "row", gap: 12, alignItems: "center"}}>
                          <div style={{width: 80, height: 80, background: "#333", borderRadius: "50%", overflow:"hidden", flexShrink: 0}}>
                              {acc.img ? <img src={acc.img} alt={acc.nama} style={{width:"100%", height:"100%", objectFit:"cover"}}/> : <div style={{width:"100%",height:"100%", display:"flex",alignItems:"center",justifyContent:"center", fontSize:30}}>👤</div>}
                          </div>
                          <div style={{flex: 1}}>
                              <div style={{display:"flex", justifyContent:"space-between"}}>
                                  <div style={{fontWeight:"bold", fontSize: 16, color: "#FFD700"}}>{acc.nama} <span style={{fontSize:12, color:"#aaa"}}>Lv.{acc.level}</span></div>
                                  {acc.wajibMM?.toLowerCase() === 'ya' && <div style={{fontSize: 10, background: "red", color:"white", padding: "2px 6px", borderRadius: 4, height:"fit-content"}}>🛡️ WAJIB MM</div>}
                              </div>
                              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 4, fontSize: 11, margin: "8px 0", color: "#ccc", background:"rgba(255,255,255,0.05)", padding: 6, borderRadius: 4}}>
                                  <div>⚔️ {acc.melee} | 🏹 {acc.dist}</div>
                                  <div>✨ {acc.magic} | 🛡️ {acc.def}</div>
                              </div>
                              <div style={{fontSize: 11, marginBottom: 4, color: "#aaa"}}>Set: {acc.setInfo}</div>
                              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 4}}>
                                  <div>
                                      <div style={{fontSize:10, color:"#aaa"}}>Owner: {acc.owner}</div>
                                      <div style={{color: "#4caf50", fontWeight:"bold", fontSize: 14}}>{acc.harga}</div>
                                  </div>
                                  <button onClick={()=>contactOwner(acc, 'account')} style={{...styles.btn, fontSize: 12, background: "#333", border: "1px solid #555"}}>💬 Nego</button>
                              </div>
                          </div>
                      </div>
                  ))}

                  {/* FIX: TAMPILAN KOSONG */}
                  {marketTab === 'items' && titipanItems.length === 0 && (
                      <div style={{textAlign: "center", color: theme.subText, marginTop: 40, width: "100%", gridColumn: "1 / -1"}}>
                        <div style={{fontSize: 40}}>🤷‍♂️</div>
                        <p>Belum ada barang titipan saat ini.</p>
                      </div>
                  )}
                  {marketTab === 'accounts' && titipanAccounts.length === 0 && (
                      <div style={{textAlign: "center", color: theme.subText, marginTop: 40, width: "100%", gridColumn: "1 / -1"}}>
                        <div style={{fontSize: 40}}>🕵️</div>
                        <p>Belum ada akun titipan saat ini.</p>
                      </div>
                  )}
              </div>
              <div style={styles.fab} onClick={() => setTitipMenuOpen(!titipMenuOpen)}>{titipMenuOpen ? "✕" : "+"}</div>
              {titipMenuOpen && (
                  <div style={styles.fabMenu}>
                      <button onClick={()=>titipJualWA('account')} style={{padding: "10px 20px", borderRadius: 20, border:"none", background: "#fff", color:"#333", fontWeight:"bold", boxShadow:"0 4px 10px rgba(0,0,0,0.3)", display:"flex", alignItems:"center", gap: 8}}>👤 Titip Akun</button>
                      <button onClick={()=>titipJualWA('item')} style={{padding: "10px 20px", borderRadius: 20, border:"none", background: "#fff", color:"#333", fontWeight:"bold", boxShadow:"0 4px 10px rgba(0,0,0,0.3)", display:"flex", alignItems:"center", gap: 8}}>⚔️ Titip Item</button>
                  </div>
              )}
          </div>
      </div>
  );

  /* ===== MAIN RENDER ===== */
  if (!loading && !isStoreOpen) {
    return (
      <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
        <img src="/logo.png" height={60} alt="Logo" style={{marginBottom: 20}} />
        <h2 style={{color: "#FF4444", fontSize: 28, marginBottom: 10}}>🔴 TOKO TUTUP</h2>
        <p style={{color: theme.subText, maxWidth: 300, marginBottom: 30}}>Maaf ya, admin lagi istirahat. Cek lagi nanti ya!</p>
        <button onClick={contactAdmin} style={{ background: "#25D366", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 50, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>
          <span>💬 Chat WhatsApp Admin</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "sans-serif", paddingBottom: 80 }}>
      
      {/* HEADER */}
      <header style={styles.header}>
        <div style={{display:"flex", alignItems:"center", gap: 10}}>
            <img src="/logo.png" height={36} alt="Logo" />
        </div>
        <div style={{display:"flex", alignItems:"center", gap: 15}}>
            <div style={{cursor:"pointer", fontSize: 22}} onClick={() => setMarketOpen(true)}>🏪</div>
            <div style={{cursor:"pointer", fontSize: 20}} onClick={toggleTheme}>{darkMode ? "☀️" : "🌙"}</div>
            <div style={styles.cartIcon} onClick={() => setCartOpen(true)}>
                🛒
                {cart.length > 0 && <span style={styles.cartBadge}>{totalQty}</span>}
            </div>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        
        {/* LELANG SECTION */}
        {auctionData && auctionData.status !== "empty" && (
        <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(255, 68, 68, 0.5)", border: "2px solid #FF4444", background: theme.auctionBg, transition: "all 0.3s ease" }}>
            <div onClick={() => setIsAuctionExpanded(!isAuctionExpanded)} style={{ padding: "12px 16px", background: "linear-gradient(90deg, #880000 0%, #aa0000 100%)", color: "white", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{display:"flex", alignItems:"center", gap: 12}}>
                  <div style={{fontSize: 20}}>🔨</div>
                  <div>
                    <div style={{fontSize: 11, opacity: 0.8, fontWeight:"bold", textTransform:"uppercase"}}>Live Auction {isAuctionExpanded ? "▼" : "▶"}</div>
                    {!isAuctionExpanded && <div style={{fontSize: 15, fontWeight: "bold", color: "#FFD700"}}>{auctionData.item}</div>}
                  </div>
              </div>
              <div style={{textAlign: "right"}}>
                  <div style={{fontSize: 14, fontWeight: "bold", fontFamily: "monospace", color: "#fff"}}>{timeLeft}</div>
              </div>
            </div>

            {isAuctionExpanded && (
            <div style={{ padding: 16, textAlign:"center" }}>
                <strong style={{fontSize: 22, display:"block", marginBottom: 5, color: theme.text}}>{auctionData.item}</strong>
                <div style={{fontSize: 32, fontWeight:"bold", color: "#25D366", textShadow: "0 0 15px rgba(37, 211, 102, 0.4)", margin: "5px 0"}}>{formatGold(auctionData.currentBid)}</div>
                
                {auctionData.leaderboard && (
                    <div style={{ marginTop: 15, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px", textAlign: "left", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {auctionData.leaderboard.slice(0,3).map((l, i) => (
                            <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)"}}>
                                <span style={{color: i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32", fontWeight:"bold"}}>{i===0?"🥇":i===1?"🥈":"🥉"} {l.name}</span>
                                <span style={{color:"#25D366"}}>{formatGold(l.bid)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {!auctionData.isEnded && (
                    <div style={{display:"flex", gap: 8, marginTop: 20}}>
                        <input type="number" placeholder="Nominal Bid..." value={bidAmount} onChange={e => setBidAmount(e.target.value)} style={{...styles.input, flex: 1, marginBottom: 0}} />
                        <button onClick={() => handleBid("BID")} disabled={bidLoading} style={{background: "#FF4444", color: "white", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight:"bold"}}>BID</button>
                        {/* Logic Button BIN */}
                        {auctionData.currentBid < auctionData.binPrice ? (
                            <button onClick={() => handleBid("BIN")} disabled={bidLoading} style={{background: "#FFD700", color: "#000", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight:"bold"}}>BIN</button>
                        ) : (
                            <button disabled style={{background: "#555", color: "#ccc", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight:"bold", cursor: "not-allowed"}}>BIN CLOSED</button>
                        )}
                    </div>
                )}
            </div>
            )}
        </div>
        )}

        {/* FIX: HERO ITEM (HOT ITEMS) DIBALIKIN + KATEGORI */}
        {heroItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginLeft: 8, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              🔥 Hot Items
            </h3>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10, paddingLeft: 8 }}>
               {heroItems.map((item, idx) => (
                 <div key={idx} style={{ minWidth: 140, background: theme.cardBg, border: theme.border, borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{fontWeight: "bold", fontSize: 14, color: "#FFD700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{item.nama}</div>
                    {/* Munculin Kategori Kecil */}
                    <div style={{fontSize: 10, color: theme.subText, marginTop: -3}}>({item.targetKategori || item.kategori})</div>
                    <div style={{fontSize: 11, color: item.status?.toLowerCase() === 'full' ? '#4caf50' : item.status?.toLowerCase() === 'kosong' ? '#f44336' : '#ff9800'}}>{statusLabel(item.status)}</div>
                    {item.buy > 0 && (
                       <button onClick={() => addToCart(item, 'buy')} disabled={item.status === 'Kosong'} style={{...styles.btn, fontSize: 11, width: "100%", marginTop: "auto", opacity: item.status === 'Kosong' ? 0.5 : 1}}>
                           Beli <span style={{color:"white"}}>{(item.buy/1000)}k</span>
                       </button>
                    )}
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* FILTER & SEARCH */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto", paddingBottom: 5 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: category === c ? theme.accent : theme.cardBg, color: category === c ? "#fff" : theme.text, whiteSpace: "nowrap", cursor: "pointer", border: category === c ? "none" : theme.border }}>
              {c}
            </button>
          ))}
        </div>
        <input placeholder="Cari item..." value={search} onChange={e => setSearch(e.target.value)} style={styles.input} />

        {/* LIST ITEM TOKO */}
        <div style={styles.grid}>
          {filteredItems.map((item, idx) => (
            <div key={idx} style={styles.card}>
              <div style={{fontWeight: "bold", fontSize: 16, color: "#FFD700"}}>
                  {item.nama}
                  <span style={{fontSize: 10, display:"block", color: theme.subText, fontWeight:"normal"}}>({item.kategori})</span>
              </div>
              <div style={{fontSize: 12, color: item.status?.toLowerCase() === 'full' ? '#4caf50' : item.status?.toLowerCase() === 'kosong' ? '#f44336' : '#ff9800'}}>
                  {statusLabel(item.status)}
              </div>
              
              <div style={{marginTop: "auto"}}>
                 {item.buy > 0 && (
                     <button onClick={() => addToCart(item, 'buy')} disabled={item.status === 'Kosong'} style={{...styles.btn, width: "100%", marginBottom: 4, opacity: item.status === 'Kosong' ? 0.5 : 1}}>
                         Beli <span style={{color: "white", fontWeight: "bold"}}>{item.buy.toLocaleString('id-ID')}</span> 🪙
                     </button>
                 )}
                 {item.sell > 0 && (
                     <button onClick={() => addToCart(item, 'sell')} style={{...styles.btn, width: "100%", background: "#333", border: "1px solid #555"}}>
                         Jual {formatGold(item.sell)}
                     </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* RENDER MARKET MODAL */}
      {marketOpen && <MarketModal />}

      {/* CART MODAL (FIX: KLIK LUAR UNTUK CLOSE) */}
      {cartOpen && (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", justifyContent: "end" }}
        >
           <div style={{ width: "70%", maxWidth: 320, background: theme.modalBg, height: "100%", padding: 20, overflowY: "auto", borderLeft: theme.border, cursor: "default" }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
                  <h2>Keranjang</h2>
                  <button onClick={() => setCartOpen(false)} style={{background:"transparent", border:"none", color: theme.text, fontSize: 24}}>✕</button>
              </div>
              
              {cart.map(c => (
                  <div key={c.key} style={{marginBottom: 15, paddingBottom: 15, borderBottom: "1px solid #333"}}>
                      <div style={{fontWeight:"bold"}}>{c.nama} ({c.mode})</div>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 8}}>
                          <div>{formatGold(c.mode === 'buy' ? c.buy : c.sell)} x {c.qty}</div>
                          <div style={{display:"flex", gap: 10}}>
                              <button onClick={() => updateQty(c, c.qty - 1)}>-</button>
                              <button onClick={() => updateQty(c, c.qty + 1)}>+</button>
                              <button onClick={() => removeFromCart(c)} style={{background:"red", color:"white", border:"none", borderRadius:4}}>Hapus</button>
                          </div>
                      </div>
                  </div>
              ))}

              <div style={{marginTop: 20, paddingTop: 20, borderTop: "2px solid #555"}}>
                  {/* FIX: IGN WAJIB, WA OPTIONAL UTK CART */}
                  <h4 style={{marginBottom: 10}}>Data Pembeli</h4>
                  <input placeholder="Nickname In-Game (IGN) *" value={ign} onChange={(e) => {setIgn(e.target.value); localStorage.setItem("gearShopIGN", e.target.value)}} style={styles.input} />
                  <input placeholder="Nomor WhatsApp (Optional)" type="tel" value={waNumber} onChange={(e) => {setWaNumber(e.target.value); localStorage.setItem("gearShopWA", e.target.value)}} style={styles.input} />
                  
                  <div style={{display:"flex", justifyContent:"space-between", fontSize: 18, fontWeight:"bold", marginTop: 10}}>
                      <span>Total:</span>
                      <span>{formatGold(totalPrice)}</span>
                  </div>
                  <button onClick={sendWA} style={{...styles.btn, width: "100%", background: "#25D366", padding: 15, marginTop: 20, fontSize: 16}}>
                      WhatsApp Checkout 🚀
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
