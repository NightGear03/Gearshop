/* PART 1 of 7: Imports, Config & State Definitions */
"use client";

import { useEffect, useState } from "react";

// === CONFIG URL (NEW UPDATED) ===
const AUCTION_API = "https://script.google.com/macros/s/AKfycby6jpE2HK1O_TNXH_eHryEGyvD19FNlAu85EUGAr8wGtOlrHugEaYErW8DTaXnSisBH/exec";

const STORE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1LFLYLmzl-YbYaYoFpEInQKGGzA9nuGzDA_0w9ulArJs/export?format=csv";
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

  /* ===== STATE CALCULATOR ===== */
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState({
    lvl: "", stat: "", extra: "", wpn: 5, mode: "afk", magic: false
  });
  const [calcResult, setCalcResult] = useState(null);

  /* ===== STATE GOLD MARKET (FITUR BARU) ===== */
  const [isGoldOpen, setIsGoldOpen] = useState(false);
  const [goldData, setGoldData] = useState([]);
  const [goldView, setGoldView] = useState("list"); // 'list' or 'form'
  const [goldLoading, setGoldLoading] = useState(false);
  
  // Form State
  const [goldForm, setGoldForm] = useState({
      tipe: "JUAL",
      nama: "",
      jumlah: "",
      harga: "",
      payment: "",
      status: "Perlu MM", 
      reqTrusted: false
  });

  // State MM & Modals Gold Market
  const [mmList, setMmList] = useState([]);
  const [isMMListOpen, setIsMMListOpen] = useState(false);
  const [successModal, setSuccessModal] = useState({ show: false, token: "" });
  const [deleteModal, setDeleteModal] = useState({ show: false, tokenInput: "" });

  /* ===== STATE CART & USER ===== */
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ign, setIgn] = useState("");
  const [waNumber, setWaNumber] = useState("");

  /* ===== STATE AUCTION (LELANG - DIPERBAIKI) ===== */
  const [auctionData, setAuctionData] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [isAuctionExpanded, setIsAuctionExpanded] = useState(false);
  
  // State Bin & Confirm (Dikembalikan karena hilang di file 14)
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [binCode, setBinCode] = useState("");
  const [bidConfirm, setBidConfirm] = useState(null);

  /* ===== STATE DARK MODE & UI ===== */
  const [darkMode, setDarkMode] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
    /* PART 2 of 7: Load Data & Parsing Logic */

  /* ===== LOAD ALL DATA (STORE, TITIPAN & USER) ===== */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Load Data Toko Utama
        const resStore = await fetch(STORE_SHEET_URL);
        const textStore = await resStore.text();
        parseStoreData(textStore);

        // 2. Load Data Titipan Items
        const resTItems = await fetch(TITIPAN_ITEMS_URL);
        const textTItems = await resTItems.text();
        parseTitipanItems(textTItems);

        // 3. Load Data Titipan Accounts
        const resTAcc = await fetch(TITIPAN_ACCOUNTS_URL);
        const textTAcc = await resTAcc.text();
        parseTitipanAccounts(textTAcc);

        // 4. Load LocalStorage (Data User Tersimpan)
        const savedIgn = localStorage.getItem("gearShopIGN");
        if (savedIgn) setIgn(savedIgn);
        const savedWa = localStorage.getItem("gearShopWA");
        if (savedWa) setWaNumber(savedWa);
        const savedTheme = localStorage.getItem("gearShopTheme");
        if (savedTheme) setDarkMode(savedTheme === "dark");
        
        // 5. Cek Magic Link Admin (kunci=firman123)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('kunci') === "firman123") {
            localStorage.setItem("gearshop_admin", "true");
            console.log("Mode Admin Aktif!");
        }

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
      
      // Deteksi Hero Item
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

    // Logic Status Toko & Maintenance
    const systemRow = parsed.find(item => item.kategori?.toUpperCase() === "#SYSTEM" && item.nama?.toUpperCase() === "STATUS_TOKO");
    const statusToko = systemRow ? systemRow.status?.toUpperCase() : "BUKA";
    const isAdmin = localStorage.getItem("gearshop_admin") === "true";

    if (statusToko === "TUTUP") {
        setIsStoreOpen(false); setIsMaintenance(false);
    } else if (statusToko === "MT") {
        if (isAdmin) { setIsStoreOpen(true); setIsMaintenance(false); }
        else { setIsStoreOpen(false); setIsMaintenance(true); }
    } else {
        setIsStoreOpen(true); setIsMaintenance(false);
    }

    // Pisahkan Hero Item & Item Biasa
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
        return { nama: c[0]?.trim(), harga: c[1]?.trim(), owner: c[2]?.trim(), status: c[3]?.trim(), tipeHarga: c[4]?.trim(), img: c[5]?.trim() || null, waOwner: c[6]?.trim() || null };
    });
    setTitipanItems(data);
  };

  // -- Parser Titipan Accounts --
  const parseTitipanAccounts = (text) => {
    const rows = text.split(/\r?\n/).slice(1);
    const data = rows.filter(r => r.trim() !== "").map(r => {
        const c = r.split(",");
        return { nama: c[0]?.trim(), level: c[1]?.trim(), melee: c[2]?.trim(), dist: c[3]?.trim(), magic: c[4]?.trim(), def: c[5]?.trim(), setInfo: c[6]?.trim(), owner: c[7]?.trim(), status: c[8]?.trim(), tipeHarga: c[9]?.trim(), wajibMM: c[10]?.trim(), harga: c[11]?.trim(), img: c[12]?.trim() || null, waOwner: c[13]?.trim() || null };
    });
    setTitipanAccounts(data);
  };
  /* PART 3 of 7: Auction, Gold Market & MM Logic (MERGED & FIXED) */

  /* ===== AUCTION TIMER & FETCH ===== */
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

  /* ===== GOLD MARKET LOGIC (FITUR BARU) ===== */
  
  // 1. Fetch Gold Data & MM
  const fetchGoldData = async () => {
      setGoldLoading(true);
      try {
          const res = await fetch(`${AUCTION_API}?type=gold&t=${new Date().getTime()}`);
          const data = await res.json();
          if (data.status === "SUCCESS" || data.status === "OK") setGoldData(data.data);
      } catch (e) { console.error("Err Gold", e); }
      finally { setGoldLoading(false); }
  };

  const fetchMMList = async () => {
      try {
          const res = await fetch(`${AUCTION_API}?type=mm&t=${new Date().getTime()}`);
          const data = await res.json();
          if (data.status === "SUCCESS" || data.status === "OK") setMmList(data.data);
      } catch (e) { console.error("Err MM", e); }
  };

  // Auto-fetch saat modal dibuka
  useEffect(() => {
      if (isGoldOpen) {
          fetchGoldData();
          fetchMMList();
      }
  }, [isGoldOpen]);

  /* ===== HELPERS (IP & VALIDASI) ===== */
  const formatWaNumber = (num) => {
    if (!num) return null;
    let clean = num.replace(/\D/g, ''); 
    if (clean.startsWith('0')) return '62' + clean.slice(1);
    if (clean.startsWith('8')) return '62' + clean;
    return clean;
  };

  const isValidWhatsApp = (phoneNumber) => /^08[0-9]{8,13}$/.test(phoneNumber);

  async function getMyIP() {
    try { 
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json(); 
        return data.ip; 
    } catch (error) { return "UNKNOWN"; }
  }

  /* ===== HANDLERS: GOLD MARKET ===== */
  const handlePostGold = async () => {
      if (!goldForm.nama || !goldForm.jumlah || !goldForm.harga || !goldForm.payment) {
          showToast("Lengkapi semua data!", "error");
          return;
      }
      if (!ign || !waNumber) {
          showToast("Isi IGN & WA di Keranjang dulu!", "error");
          setCartOpen(true);
          return;
      }

      setGoldLoading(true);
      try {
          const ip = await getMyIP();
          const payload = {
              action: "post_gold",
              ...goldForm,
              wa: waNumber,
              ip: ip,
              reqTrusted: goldForm.status === "Trusted"
          };
          const res = await fetch(AUCTION_API, {
              method: "POST", body: JSON.stringify(payload)
          });
          const result = await res.json();

          if (result.status === "SUCCESS") {
              setSuccessModal({ show: true, token: result.data.token });
              setGoldView("list");
              fetchGoldData();
          } 
          else if (result.status === "NEED_VERIFICATION") {
              if(confirm("GAGAL: Nomor Anda belum terdaftar sebagai Trusted Seller.\n\nKlik OK untuk verifikasi ke Admin via WhatsApp.")) {
                  window.open("https://wa.me/6283101456267?text=Halo%20Admin,%20saya%20mau%20verifikasi%20Trusted%20Seller.", "_blank");
              }
          }
          else {
              showToast(result.message, "error");
          }
      } catch (e) { showToast("Gagal posting, cek koneksi.", "error"); }
      finally { setGoldLoading(false); }
  };

  const handleDeleteGold = async () => {
      const token = deleteModal.tokenInput;
      if (!token) return;

      setGoldLoading(true);
      try {
          const res = await fetch(AUCTION_API, {
              method: "POST", body: JSON.stringify({ action: "delete_gold", token })
          });
          const result = await res.json();
          if (result.status === "SUCCESS") {
              showToast("Iklan berhasil dihapus!", "success");
              setDeleteModal({ show: false, tokenInput: "" });
              fetchGoldData();
          } else {
              showToast(result.message, "error");
          }
      } catch (e) { showToast("Error koneksi", "error"); }
      finally { setGoldLoading(false); }
  };

  /* ===== HANDLERS: AUCTION (RESTORED FROM BACKUP) ===== */
  // Ini fungsi yang HILANG di file 14, gw balikin biar tombol BID/BIN jalan.
  
  const handleBid = async (action, code = null) => {
    // 1. Validasi
    if (localStorage.getItem("gearshop_status") === "BANNED") { 
        showToast("Akses Anda diblokir.", "error");
        return; 
    }
    if (!ign || !waNumber) { 
        showToast("Wajib isi IGN dan WA di keranjang!", "error");
        setCartOpen(true); return; 
    }
    if (!isValidWhatsApp(waNumber)) { 
        showToast("Nomor WA Tidak Valid (08xx only).", "error");
        setCartOpen(true); return; 
    }

    const amount = action === "BIN" ? auctionData.binPrice : parseInt(bidAmount);

    // 2. Logic BIN: Buka Modal Kode
    if (action === "BIN" && !code) {
        if (auctionData.currentBid >= auctionData.binPrice) {
            showToast("Harga Bid sudah melewati harga BIN.", "error");
            return;
        }
        setIsBinModalOpen(true); return;
    }

    // 3. Validasi Nominal Bid
    if (action === "BID") {
        if (!amount || amount <= auctionData.currentBid) {
            showToast(`Minimal Bid: ${(auctionData.currentBid + auctionData.increment).toLocaleString('id-ID')}`, "error");
            return;
        }
        if (amount >= auctionData.binPrice) {
             showToast(`Bid ketinggian! Maksimal bid harus di bawah BIN.`, "error");
             return;
        }
        if ((amount - auctionData.currentBid) % auctionData.increment !== 0) {
            showToast(`Bid harus kelipatan ${auctionData.increment.toLocaleString('id-ID')}`, "error");
            return;
        }
    }
    
    // 4. Buka Modal Konfirmasi Modern
    setBidConfirm({ action, amount, code });
  };

  const executeBid = async () => {
    if (!bidConfirm) return;
    const { action, amount, code } = bidConfirm;
    
    setBidLoading(true);
    setBidConfirm(null); // Tutup modal
    
    showToast("Memproses Bid... Mohon tunggu...", "info");
    
    try {
        const userIP = await getMyIP();
        const payload = { action, bid: amount, ign, wa: waNumber, ip: userIP };
        if (action === "BIN" && code) payload.code = code; 

        const response = await fetch(AUCTION_API, {
            method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain" }
        });
        const result = await response.json();

        if (result.status === "BLOCKED") {
            localStorage.setItem("gearshop_status", "BANNED");
            showToast("ANDA DIBLOKIR!", "error");
        } else if (result.status === "SUCCESS") {
             setBidAmount("");
             setBinCode(""); setIsBinModalOpen(false);
             setTimeout(fetchAuction, 1500); 
             showToast(result.message, "success");
        } else {
             showToast(result.message, "error");
        }
    } catch (error) { 
        showToast("Koneksi Error", "error");
    } finally { setBidLoading(false); }
  };
                  
  const requestBinCode = () => {
      const cleanWA = waNumber.replace(/\D/g, '');
      const text = `Halo Admin, saya *${ign}* (WA: ${cleanWA}).\nSaya mau *BIN (Buy It Now)* item: *${auctionData.item}*.\n\nMohon kirimkan *Kode Konfirmasi BIN*-nya.\nSaya siap transaksi.`;
      window.open(`https://wa.me/6283101456267?text=${encodeURIComponent(text)}`, "_blank");
  };

  /* PART 4 of 7: Calculator Logic, UI Helpers & Cart Functions */

  /* ===== LOGIC CALCULATOR (REALTIME & JUJUR) ===== */
  useEffect(() => {
    handleCalculate();
  }, [calcInput]);

  const handleCalculate = () => {
    // Validasi input: Kalau kosong dianggap 0
    const lvl = parseInt(calcInput.lvl) || 0;
    const stat = parseInt(calcInput.stat) || 0;
    const extra = parseInt(calcInput.extra) || 0;
    const wpn = parseInt(calcInput.wpn) || 0;

    // Jangan hitung kalau data nol semua
    if (lvl === 0 || stat === 0) {
        setCalcResult(null);
        return;
    }

    // 1. Hitung Effective Stat
    let effectiveStat = stat;
    if (calcInput.mode === 'ptrain') {
        effectiveStat = calcInput.magic ? (stat * 1.35) : (stat * 1.2);
    }

    // 2. Hitung Total Power
    const powerScore = effectiveStat + extra + wpn + Math.floor(lvl / 2);

    // 3. Database Monster (Start dari 14 = Stat 9 + Wpn 5)
    const MONSTER_DB = [
      { name: "Rat (Lv.1)", min: 14 }, 
      { name: "Rat (Lv.3)", min: 22 },
      { name: "Crow (Lv.6)", min: 33 },
      { name: "Wolf (Lv.9)", min: 42 },
      { name: "Mummy", min: 55 },
      { name: "Pharaoh", min: 105 },
      { name: "Assassin", min: 145 },
      { name: "Zombie", min: 170 },
      { name: "Skeleton", min: 195 },
      { name: "Skeleton Warrior", min: 265 },
      { name: "Vampire", min: 345 },
      { name: "Drow Assassin", min: 450 },
      { name: "Lizard Warrior", min: 610 },
      { name: "Lizard Captain", min: 730 },
      { name: "Minotaur", min: 940 },
      { name: "Minotaur (High)", min: 1150 },
      { name: "Demon", min: 1400 }
    ];

    // 4. Logic Pencarian Target
    // KASUS KHUSUS: Kalau Power di bawah 14 (Belum kuat lawan Tikus Lv.1)
    if (powerScore < 14) {
        setCalcResult({
            score: Math.floor(powerScore),
            target: "❌ Belum Kuat", // Vonis Jujur
            next: "Rat (Lv.1)",
            need: Math.ceil(14 - powerScore) 
         });
        return;
    }

    // KASUS NORMAL: Cari monster yang cocok
    let currentTarget = MONSTER_DB[0];
    let nextTarget = { name: "MAX LEVEL", min: powerScore };

    for (let i = 0; i < MONSTER_DB.length; i++) {
        if (powerScore >= MONSTER_DB[i].min) {
            currentTarget = MONSTER_DB[i];
            nextTarget = MONSTER_DB[i+1] || { name: "MAX LEVEL", min: powerScore };
        } else {
            break;
        }
    }

    setCalcResult({
        score: Math.floor(powerScore),
        target: currentTarget.name,
        next: nextTarget.name,
        need: Math.max(0, Math.ceil(nextTarget.min - powerScore))
    });
  };

  /* ===== UI HELPERS & CART FUNCTIONS ===== */
  
  // Fungsi Helper Toast (Pengganti Alert Browser)
  const showToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
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
    const key = `${item.nama}-${item.kategori}-${mode}`;
    const exist = cart.find(c => c.key === key);
    if (exist) { setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
    } else { setCart([...cart, { ...item, mode, qty: 1, key }]); }
    setCartOpen(true);
  };

  const updateQty = (item, qty) => { if (qty < 1) return;
  setCart(cart.map(c => c.key === item.key ? { ...c, qty } : c)); };

  const removeFromCart = item => setCart(cart.filter(c => c.key !== item.key));
  
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + (c.mode === "buy" ? c.buy : c.sell) * c.qty, 0);

  const handleCheckoutClick = () => {
    if (!cart.length) return;
    // Pake Toast bukan Alert
    if (!ign) { showToast("Mohon isi IGN (Nickname Game) dulu ya!", "error"); return;
    }
    setCartOpen(false); setConfirmOpen(true);
  };

  const processToWA = () => {
    const itemText = cart.map(c => {
        const kategoriStr = c.kategori?.toLowerCase().includes("diamond") ? "" : ` [${c.kategori}]`;
        return `- ${c.nama}${kategoriStr} (${c.mode.toUpperCase()}) x${c.qty} = ${((c.mode === 'buy' ? c.buy : c.sell) * c.qty).toLocaleString('id-ID')}`;
    }).join("%0A");
    const message = `Halo,%20saya%20*${encodeURIComponent(ign)}*%20mau%20order:%0A${itemText}%0A%0ATotal:%20${totalPrice.toLocaleString('id-ID')}%20Gold`;
    window.open(`https://wa.me/6283101456267?text=${message}`, "_blank");
    setConfirmOpen(false);
  };

  // Helper WhatsApp Link
  const contactAdmin = () => window.open("https://wa.me/6283101456267?text=Halo%20Admin,%20mau%20tanya-tanya%20dong.", "_blank");
  
  const contactOwner = (item, type) => {
    const targetWA = item.waOwner ? formatWaNumber(item.waOwner) : "6283101456267";
    const text = type === 'account' ? `Halo, saya minat akun titipan: *${item.nama}* (Owner: ${item.owner}).` : `Halo, saya minat barang titipan: *${item.nama}* (Owner: ${item.owner}).`;
    window.open(`https://wa.me/${targetWA}?text=${encodeURIComponent(text)}`, "_blank");
  };
  
  const titipJualWA = (type) => {
      let text = type === 'item' ?
      `Halo min, mau nitip jual item dong.\nNama item :\nHarga item :\nOwner item :\nHarga nego/fix :\nGambar item : (jika ada)` : `Halo min, mau titip jual akun dong.\nNickname :\nLevel :\nMelee :\nDistance :\nMagic :\nDefense :\nSet :\nOwner :\nNego/Fix :\nHarga : (bebas mau rp/gold)\nWajib MM/Tidak :\nGambar akun : (jika ada)`;
      window.open(`https://wa.me/6283101456267?text=${encodeURIComponent(text)}`, "_blank");
  };
    /* PART 5 of 7: Styles, Main Layout & Auction UI (FIXED FONTS & COLORS) */

  const categories = ["All", ...new Set(items.map(i => i.kategori))];
  const filteredItems = items.filter(i => (i.nama.toLowerCase().includes(search.toLowerCase())) && (category === "All" || i.kategori === category)).sort((a, b) => sort === "buy-asc" ? a.buy - b.buy : sort === "buy-desc" ? b.buy - a.buy : 0);

  // Theme Configuration (Dark Mode Default)
  const theme = { 
      bg: darkMode ? "#121212" : "#f5f5f5", 
      text: darkMode ? "#e0e0e0" : "#333", 
      cardBg: darkMode ? "#1e1e1e" : "#fff", 
      border: darkMode ? "1px solid #333" : "1px solid #ddd", 
      modalBg: darkMode ? "#1a1a1a" : "#fff", 
      accent: "#B8860B", 
      inputBg: darkMode ? "#2c2c2c" : "#fff", 
      subText: darkMode ? "#aaa" : "#666",
      // Gradient Auction Baru (Merah Gelap Elegan)
      auctionBg: darkMode ? "linear-gradient(135deg, #2c0000 0%, #4a0000 100%)" : "linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%)" 
  };

  const styles = {
      header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#1e293b", color: "#fff", borderBottom: theme.border, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
      cartIcon: { position: "relative", fontSize: 24, cursor: "pointer" },
      cartBadge: { position: "absolute", top: -5, right: -8, background: "red", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", justifyContent: "center", alignItems: "center" },
      grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 },
      
      // Style Glassmorphism untuk Card
      card: { background: theme.cardBg, border: theme.border, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6, transition: "transform 0.2s", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
      
      input: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #444", background: theme.inputBg, color: theme.text, marginBottom: 10, outline: "none", fontSize: 14 },
      btn: { background: theme.accent, color: "#fff", border: "none", padding: "10px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", transition: "0.2s" },
      
      // Modal Style Modern
      modalOverlay: { position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)" }, 
      modalContent: { background: theme.modalBg, width: "100%", maxWidth: 500, maxHeight: "90vh", borderRadius: 16, padding: 20, overflowY: "auto", position: "relative", border: "1px solid #333", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" },
      
      tabContainer: { display: "flex", gap: 10, marginBottom: 20, borderBottom: theme.border, paddingBottom: 10 },
      tabBtn: (active) => ({ flex: 1, padding: 10, borderRadius: 8, background: active ? theme.accent : "transparent", color: active ? "#fff" : theme.text, border: active ? "none" : theme.border, cursor: "pointer", fontWeight: "bold", textAlign: "center" }),
      
      fab: { position: "fixed", bottom: 30, right: 30, background: "#25D366", color: "white", width: 56, height: 56, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 30, boxShadow: "0 4px 15px rgba(37, 211, 102, 0.4)", cursor: "pointer", zIndex: 201 },
      fabMenu: { position: "fixed", bottom: 95, right: 30, display: "flex", flexDirection: "column", gap: 10, zIndex: 201 }
  };

  // Maintenance View
  if (!loading && isMaintenance) { return (<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#121212", color: "#ffffff", fontFamily: "sans-serif", textAlign: "center", padding: "20px" }}><h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "10px", letterSpacing: "2px" }}>⚙️GEARSHOP⚙️</h1><h2 style={{ color: "#f1c40f", fontSize: "1.5rem", marginBottom: "20px", border: "2px solid #f1c40f", padding: "10px 20px", borderRadius: "8px", background: "rgba(241, 196, 15, 0.1)" }}>🚧 MAINTENANCE 🚧</h2><p style={{ fontSize: "1.1rem", marginBottom: "5px" }}>Silahkan cek dalam beberapa waktu lagi.</p><p style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: "20px" }}>Terimakasih 😁</p></div>);
  }
  
  // Store Closed View
  if (!loading && !isStoreOpen) { return (<div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}><img src="/logo.png" height={60} alt="Logo" style={{marginBottom: 20}} /><h2 style={{color: "#FF4444", fontSize: 28, marginBottom: 10}}>🔴 TOKO TUTUP</h2><p style={{color: theme.subText, maxWidth: 300, marginBottom: 30}}>Maaf ya, admin lagi istirahat. Cek lagi nanti ya!</p><button onClick={contactAdmin} style={{ background: "#25D366", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 50, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}><span>💬 Chat WhatsApp Admin</span></button></div>);
  }

  return (
    <div style={{ 
        background: theme.bg, 
        minHeight: "100vh", 
        width: "100%", 
        WebkitTapHighlightColor: "transparent",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
        color: theme.text, 
        fontFamily: "sans-serif", 
        paddingBottom: 80 
    }}>
      {/* STYLE GLOBAL CSS FIX */}
      <style>{`
        *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-tap-highlight-color: transparent !important;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            outline: none !important;
        }
        html, body {
            overflow-x: hidden;
            -webkit-tap-highlight-color: transparent;
            overscroll-behavior-y: none;
        }
        input, textarea {
            -webkit-user-select: text !important;
            user-select: text !important;
            -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
        }
      `}</style>

      {/* HEADER UTAMA */}
      <header style={styles.header}>
          <div style={{display:"flex", alignItems:"center", gap: 10}}>
              <div style={{fontWeight:"bold", fontSize: 20, letterSpacing:1}}>GEAR<span style={{color:"#3498db"}}>SHOP</span></div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap: 20}}>
              {/* TOMBOL FITUR BARU: GOLD MARKET (Icon Coin) */}
              <div style={{cursor:"pointer", fontSize: 24, filter: "drop-shadow(0 0 5px rgba(255,215,0,0.5))"}} onClick={() => setIsGoldOpen(true)}>🪙</div>
              {/* Calculator */}
              <div style={{cursor:"pointer", fontSize: 22}} onClick={() => setCalcOpen(true)}>🧮</div>
              {/* Titipan */}
              <div style={{cursor:"pointer", fontSize: 22}} onClick={() => setMarketOpen(true)}>🏪</div>
              {/* Dark Mode */}
              <div style={{cursor:"pointer", fontSize: 20}} onClick={toggleTheme}>{darkMode ? "☀️" : "🌙"}</div>
              {/* Cart */}
              <div style={styles.cartIcon} onClick={() => setCartOpen(true)}>
                   🛒{cart.length > 0 && <span style={styles.cartBadge}>{totalQty}</span>}
              </div>
          </div>
      </header>

      <main style={{ padding: 16 }}>
        {/* === AUCTION CARD MODERN (FIXED UI) === */}
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
                     {/* FONT FIX: MONOSPACE AGAR ANGKA TIDAK GOYANG */}
                     <div style={{fontSize: 14, fontWeight: "bold", fontFamily: "monospace", color: timeLeft === "LELANG DITUTUP" ? "#FF4444" : "#fff"}}>{timeLeft}</div>
                </div>
            </div>
            
            {isAuctionExpanded && (
            <div style={{ padding: 16, textAlign:"center" }}>
                <strong style={{fontSize: 22, display:"block", marginBottom: 5, color: theme.text}}>{auctionData.item}</strong>
                <div style={{fontSize: 32, fontWeight:"bold", color: "#25D366", textShadow: "0 0 15px rgba(37, 211, 102, 0.4)", margin: "5px 0"}}>{formatGold(auctionData.currentBid)}</div>
                
                <div style={{ marginTop: 15, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px", textAlign: "left", border: "1px solid rgba(255,255,255,0.1)", maxHeight: 200, overflowY: "auto" }}>
                    <div style={{fontSize:11, color:"#aaa", marginBottom:5, textTransform:"uppercase", letterSpacing:1, borderBottom:"1px solid #555", paddingBottom:4}}>Riwayat Bid Terakhir</div>
                    {auctionData.history && auctionData.history.length > 0 ? (
                        auctionData.history.map((h, i) => (
                            <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom: "1px dashed rgba(255,255,255,0.1)", fontSize:13}}>
                                <span style={{color: h.type==="BIN"?"#FFD700":"#fff", fontWeight: h.type==="BIN"?"bold":"normal"}}>{h.name} {h.type==="BIN" && "⚡"}</span>
                                <div style={{textAlign:"right", display:"flex", gap:10, alignItems:"center"}}>
                                    <span style={{color:"#25D366"}}>{formatGold(h.bid)}</span>
                                    <span style={{fontSize:10, color:"#888"}}>{h.time}</span>
                                </div>
                            </div>
                        ))
                    ) : (<div style={{textAlign:"center", color:"#777", padding:10}}>Belum ada bid. Jadilah yang pertama!</div>)}
                </div>

                {!auctionData.isEnded && (
                <div style={{display:"flex", gap: 8, marginTop: 20}}>
                    {/* INPUT BID DAN TOMBOL BID/BIN YANG SUDAH DIBENERIN */}
                    <input type="number" placeholder="Nominal Bid..." value={bidAmount} onChange={e => setBidAmount(e.target.value)} style={{...styles.input, flex: 1, marginBottom: 0}} />
                    <button onClick={() => handleBid("BID")} disabled={bidLoading} style={{background: "#FF4444", color: "white", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight:"bold"}}>BID</button>
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
          /* PART 6 of 7: Store Content & Calculator Modal */

        {/* HERO ITEM (HOT ITEMS) */}
        {heroItems.length > 0 && (
        <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginLeft: 8, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>🔥 Hot Items</h3>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10, paddingLeft: 8 }}>
            {heroItems.map((item, idx) => { 
                const status = item.status?.toLowerCase();
                const canBuy = (status === 'ready' || status === 'full') && item.buy > 0;
                return (
                <div key={idx} style={{ minWidth: 140, background: theme.cardBg, border: theme.border, borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 5, boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
                    <div style={{fontWeight: "bold", fontSize: 14, color: "#FFD700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{item.nama}</div>
                    <div style={{fontSize: 10, color: theme.subText, marginTop: -3}}>({item.targetKategori || item.kategori})</div>
                    <div style={{fontSize: 11, color: status === 'full' ? '#4caf50' : status === 'kosong' ? '#f44336' : '#ff9800'}}>{statusLabel(item.status)}</div>
                    <div style={{marginTop: "auto"}}>
                        <button onClick={() => canBuy && addToCart(item, 'buy')} disabled={!canBuy} style={{...styles.btn, fontSize: 11, width: "100%", background: canBuy ? theme.accent : "#333", opacity: canBuy ? 1 : 0.7, cursor: canBuy ? "pointer" : "not-allowed"}}>
                            {canBuy ? <span>Beli {item.buy.toLocaleString('id-ID')} 🪙</span> : (status === 'kosong' ? "Stok Habis" : "N/A")}
                        </button>
                    </div>
                </div>
                )})}
            </div>
        </div>
        )}

        {/* FILTER & SEARCH */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto", paddingBottom: 5 }}>
            {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: category === c ? theme.accent : theme.cardBg, color: category === c ? "#fff" : theme.text, whiteSpace: "nowrap", cursor: "pointer", border: category === c ? "none" : theme.border, transition: "0.2s" }}>{c}</button>
            ))}
        </div>
        <input placeholder="Cari item..." value={search} onChange={e => setSearch(e.target.value)} style={styles.input} />

        {/* LIST ITEM TOKO (GRID) */}
        <div style={styles.grid}>
          {filteredItems.map((item, idx) => {
            const status = item.status?.toLowerCase();
            const canBuy = (status === "ready" || status === "full") && item.buy > 0;
            const canSell = (status === "ready" || status === "take") && item.sell > 0;
            return (
            <div key={idx} style={styles.card}>
              <div style={{fontWeight: "bold", fontSize: 16, color: "#FFD700"}}>{item.nama}<span style={{fontSize: 10, display:"block", color: theme.subText, fontWeight:"normal"}}>({item.kategori})</span></div>
              <div style={{fontSize: 12, color: status === 'full' ? '#4caf50' : status === 'kosong' ? '#f44336' : '#ff9800'}}>{statusLabel(item.status)}</div>
              <div style={{marginTop: "auto"}}>
                  <button onClick={() => canBuy && addToCart(item, 'buy')} disabled={!canBuy} style={{...styles.btn, width: "100%", marginBottom: 4, background: canBuy ? theme.accent : "#333", opacity: canBuy ? 1 : 0.6, cursor: canBuy ? "pointer" : "not-allowed"}}>
                      {canBuy ? <span>Beli <span style={{color: "white", fontWeight: "bold"}}>{item.buy.toLocaleString('id-ID')}</span> 🪙</span> : (status === 'take' ? "Stok Habis" : "Tidak Tersedia")}
                  </button>
                  <button onClick={() => canSell && addToCart(item, 'sell')} disabled={!canSell} style={{...styles.btn, width: "100%", background: canSell ? "#333" : "#222", border: "1px solid #555", opacity: canSell ? 1 : 0.5, cursor: canSell ? "pointer" : "not-allowed"}}>
                      {canSell ? <span>Jual {item.sell.toLocaleString('id-ID')} 🪙</span> : (status === 'full' ? "Toko Penuh" : "Jual N/A")}
                  </button>
              </div>
            </div>
          )})}
        </div>
      </main>

      {/* === CALCULATOR MODAL === */}
      {calcOpen && (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, background: "#1a1a1a", borderTop: "2px solid #FFD700"}}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom: 20}}>
                    <h2 style={{margin:0, color: "#FFD700", display:"flex", alignItems:"center", gap: 10}}>
                        🧮 Training Planner <span style={{fontSize: 10, background: "#333", padding:"2px 6px", borderRadius:4, color:"#fff"}}>v2.1</span>
                    </h2>
                    <button onClick={()=>setCalcOpen(false)} style={{background:"transparent", border:"none", color: theme.text, fontSize: 24}}>✕</button>
                </div>

                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                    <div>
                        <label style={{fontSize: 11, color: "#aaa", marginBottom: 4, display:"block"}}>Base Level</label>
                        <input type="number" placeholder="ex: 300" value={calcInput.lvl} onChange={e => setCalcInput({...calcInput, lvl: e.target.value})} style={styles.input} />
                    </div>
                    <div>
                        <label style={{fontSize: 11, color: "#aaa", marginBottom: 4, display:"block"}}>Main Stat</label>
                        <input type="number" placeholder="ex: 320" value={calcInput.stat} onChange={e => setCalcInput({...calcInput, stat: e.target.value})} style={styles.input} />
                    </div>
                </div>

                <div style={{marginBottom: 10}}>
                    <label style={{fontSize: 11, color: "#aaa", marginBottom: 4, display:"block"}}>Extra Stat (Ring/Neck)</label>
                    <input type="number" placeholder="ex: 10 (Kosongkan jika 0)" value={calcInput.extra} onChange={e => setCalcInput({...calcInput, extra: e.target.value})} style={styles.input} />
                </div>

                <div style={{marginBottom: 15}}>
                    <label style={{fontSize: 11, color: "#aaa", marginBottom: 6, display:"block"}}>Weapon Attack</label>
                    <div style={{display: "flex", gap: 8, overflowX: "auto", paddingBottom: 5}}>
                        {[4, 5, 7, 9, 11, 15].map(atk => (
                            <button key={atk} onClick={() => setCalcInput({...calcInput, wpn: atk})} 
                            style={{
                                flex: 1, minWidth: 40, padding: "8px 0", borderRadius: 6, fontWeight: "bold",
                                background: calcInput.wpn === atk ? "#FFD700" : "#333",
                                color: calcInput.wpn === atk ? "#000" : "#888",
                                border: "none"
                            }}>
                                {atk}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{marginBottom: 20, background: "rgba(255,255,255,0.05)", padding: 10, borderRadius: 8}}>
                    <label style={{fontSize: 11, color: "#aaa", marginBottom: 8, display:"block"}}>Training Mode</label>
                    <div style={{display: "flex", gap: 10, marginBottom: 10}}>
                         <button onClick={() => setCalcInput({...calcInput, mode: 'afk'})} style={{flex: 1, padding: 8, borderRadius: 6, border: calcInput.mode === 'afk' ? "1px solid #FFD700" : "1px solid #444", background: calcInput.mode === 'afk' ? "rgba(255, 215, 0, 0.1)" : "transparent", color: calcInput.mode === 'afk' ? "#FFD700" : "#888"}}>
                            💤 AFK (x1)
                         </button>
                         <button onClick={() => setCalcInput({...calcInput, mode: 'ptrain'})} style={{flex: 1, padding: 8, borderRadius: 6, border: calcInput.mode === 'ptrain' ? "1px solid #FF4444" : "1px solid #444", background: calcInput.mode === 'ptrain' ? "rgba(255, 68, 68, 0.1)" : "transparent", color: calcInput.mode === 'ptrain' ? "#FF4444" : "#888"}}>
                            🔥 Ptrain (x4)
                         </button>
                    </div>
                    {calcInput.mode === 'ptrain' && (
                        <div style={{display:"flex", alignItems:"center", gap: 8, fontSize: 13, color: theme.text}}>
                            <input type="checkbox" checked={calcInput.magic} onChange={e => setCalcInput({...calcInput, magic: e.target.checked})} style={{width: 16, height: 16}} />
                            <span>Saya menggunakan Magic (Mage) 🧙‍♂️</span>
                        </div>
                    )}
                </div>

                {calcResult && (
                    <div style={{marginTop: 20, padding: 15, borderRadius: 12, background: "linear-gradient(135deg, #222 0%, #111 100%)", border: "1px solid #444", position: "relative", overflow: "hidden"}}>
                         <div style={{position: "absolute", top: -10, right: -10, fontSize: 80, opacity: 0.1}}>🎯</div>
                         <div style={{textAlign: "center", marginBottom: 15}}>
                            <div style={{fontSize: 12, color: "#888"}}>Rekomendasi Monster</div>
                            <div style={{fontSize: 28, fontWeight: "900", color: "#FFD700", textShadow: "0 0 10px rgba(255, 215, 0, 0.3)"}}>
                                {calcResult.target.toUpperCase()}
                            </div>
                            <div style={{fontSize: 11, color: "#4caf50"}}>Power Score: {calcResult.score}</div>
                         </div>
                         <div style={{display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", padding: 10, borderRadius: 8}}>
                             <div style={{fontSize: 24}}>🔜</div>
                             <div style={{flex: 1}}>
                                 <div style={{fontSize: 10, color: "#aaa"}}>Next Target:</div>
                                 <div style={{fontSize: 14, fontWeight: "bold", color: "#fff"}}>{calcResult.next}</div>
                             </div>
                             <div style={{textAlign: "right"}}>
                                 <div style={{fontSize: 10, color: "#aaa"}}>Butuh Stat:</div>
                                 <div style={{fontSize: 16, fontWeight: "bold", color: "#FF4444"}}>+{calcResult.need}</div>
                             </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
      )}
                    /* PART 7A: Pasar Warga & Gold Market UI */

      {/* === PASAR WARGA MODAL (TITIPAN) === */}
      {marketOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom: 20}}>
                    <h2 style={{margin:0}}>🏪 Pasar Warga (v2.0)</h2>
                    <button onClick={()=>setMarketOpen(false)} style={{background:"transparent", border:"none", color: theme.text, fontSize: 24}}>✕</button>
                </div>
                <div style={styles.tabContainer}>
                    <button style={styles.tabBtn(marketTab === 'items')} onClick={()=>setMarketTab('items')}>⚔️ ITEM</button>
                    <button style={styles.tabBtn(marketTab === 'accounts')} onClick={()=>setMarketTab('accounts')}>👤 AKUN</button>
                </div>
                
                <div style={marketTab === 'items' ? styles.grid : {...styles.grid, gridTemplateColumns: "1fr"}}>
                    {/* LIST BARANG TITIPAN */}
                    {marketTab === 'items' && titipanItems.map((item, idx) => (
                        <div key={idx} style={{...styles.card, position: "relative", opacity: item.status?.toLowerCase() === 'sold' ? 0.6 : 1}}>
                            {item.status?.toLowerCase() === 'sold' && (
                                <div style={{position:"absolute", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", color:"red", fontWeight:"bold", fontSize:20, zIndex:2, borderRadius: 8}}>SOLD</div>
                            )}
                            <div style={{height: 100, background: "#333", borderRadius: 4, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden"}}>
                                {item.img ? <img src={item.img} alt={item.nama} style={{width:"100%", height:"100%", objectFit:"cover"}} onError={(e)=>{e.target.onerror=null; e.target.src="https://placehold.co/100x100?text=No+Image"}} /> : <span style={{fontSize:40}}>📦</span>}
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

                    {/* LIST AKUN TITIPAN */}
                    {marketTab === 'accounts' && titipanAccounts.map((acc, idx) => (
                        <div key={idx} style={{...styles.card, flexDirection: "row", gap: 12, alignItems: "center", position: "relative", opacity: acc.status?.toLowerCase() === 'sold' ? 0.6 : 1}}>
                            {acc.status?.toLowerCase() === 'sold' && (
                                <div style={{position:"absolute", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", color:"red", fontWeight:"bold", fontSize:20, zIndex:2, borderRadius: 8}}>SOLD</div>
                            )}
                            <div style={{width: 80, height: 80, background: "#333", borderRadius: "50%", overflow:"hidden", flexShrink: 0}}>
                                {acc.img ? <img src={acc.img} alt={acc.nama} style={{width:"100%", height:"100%", objectFit:"cover"}} onError={(e)=>{e.target.onerror=null; e.target.src="https://placehold.co/100x100?text=No+Image"}} /> : <div style={{width:"100%",height:"100%", display:"flex",alignItems:"center",justifyContent:"center", fontSize:30}}>👤</div>}
                            </div>
                            <div style={{flex: 1}}>
                                <div style={{display:"flex", justifyContent:"space-between"}}>
                                    <div style={{fontWeight:"bold", fontSize: 16, color: "#FFD700"}}>{acc.nama} <span style={{fontSize:12, color:"#aaa"}}>Lv.{acc.level}</span></div>
                                    {acc.wajibMM?.toLowerCase() === 'ya' && <div style={{fontSize: 10, background: "red", color:"white", padding: "2px 6px", borderRadius: 4}}>🛡️ WAJIB MM</div>}
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
                                    <button onClick={()=>contactOwner(acc, 'account')} style={{...styles.btn, fontSize: 12, background: "#333", border: "1px solid #555"}}>{acc.tipeHarga?.toLowerCase() === 'fix' ? '💬 Beli (Fix)' : '💬 Nego'}</button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {((marketTab === 'items' && titipanItems.length === 0) || (marketTab === 'accounts' && titipanAccounts.length === 0)) && (
                        <div style={{textAlign: "center", color: theme.subText, marginTop: 40, width: "100%", gridColumn: "1 / -1"}}>
                            <div style={{fontSize: 40}}>🕵️</div>
                            <p>Belum ada data saat ini.</p>
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
      )}

      {/* === GOLD MARKET MODAL (REMASTERED) === */}
      {isGoldOpen && (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, background: "#0a0a0a", borderTop: "4px solid #FFD700"}}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom: 15, alignItems:"center"}}>
                    <h2 style={{margin:0, color: "#FFD700", display:"flex", alignItems:"center", gap:10}}>🪙 Gold Market <span style={{fontSize:10, background:"#333", padding:"2px 5px", borderRadius:4}}>P2P v2.0</span></h2>
                    <button onClick={()=>setIsGoldOpen(false)} style={{background:"transparent", border:"none", color:"#fff", fontSize:24}}>✕</button>
                </div>

                <div style={{background:"rgba(255,0,0,0.1)", border:"1px solid #500", padding:12, borderRadius:10, fontSize:11, color:"#ff8888", marginBottom:20, lineHeight: "1.4"}}>
                    ⚠️ <b>KEAMANAN TRANSAKSI:</b> Gearshop adalah platform iklan. Gunakan <b>MM Resmi</b> untuk keamanan. Transaksi Direct tanpa MM berisiko tinggi.
                </div>

                {goldView === 'list' && (
                    <>
                        <div style={{display:"flex", gap:10, marginBottom:20}}>
                           <button onClick={()=>setGoldView('form')} style={{flex:1, padding:14, background:"linear-gradient(45deg, #FFD700, #B8860B)", color:"#000", border:"none", borderRadius:10, fontWeight:"bold", boxShadow: "0 4px 15px rgba(184,134,11,0.3)"}}>+ PASANG IKLAN</button>
                           <button onClick={fetchGoldData} style={{padding:"0 15px", background:"#222", color:"#fff", border:"1px solid #444", borderRadius:10}}>🔄</button>
                        </div>
                        
                        {goldLoading ? (
                            <div style={{display:"flex", flexDirection:"column", gap:12}}>
                                {[1,2,3].map(i => (
                                    <div key={i} style={{height: 165, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)"}}></div>
                                ))}
                            </div>
                        ) : (
                            <div style={{display:"flex", flexDirection:"column", gap:12}}>
                                {goldData.map((g, i) => (
                                    <div key={i} style={{
                                        background: "rgba(255,255,255,0.03)", 
                                        backdropFilter: "blur(10px)",
                                        padding:15, borderRadius:12, 
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderLeft: g.status === 'Direct' ? "5px solid #ff4444" : (g.is_trusted ? "5px solid #1da1f2" : "5px solid #ffd700")
                                    }}>
                                        <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
                                            <div style={{fontWeight:"900", color: g.tipe === 'JUAL' ? "#4caf50" : "#f44336", fontSize: 16}}>{g.tipe} <span style={{color:"#fff"}}>{g.jumlah}</span></div>
                                            <div style={{fontSize:10, color:"#666"}}>{new Date(g.timestamp).toLocaleDateString()}</div>
                                        </div>
                                        
                                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                                            <div style={{fontSize:22, fontWeight:"bold", color:"#FFD700"}}>Rp {parseInt(g.harga).toLocaleString('id-ID')}</div>
                                            {g.is_trusted ? (
                                                <div style={{background:"#1da1f2", color:"white", padding:"4px 10px", borderRadius:6, fontSize:10, fontWeight:"bold", display:"flex", alignItems:"center", gap:5}}>🛡️ TRUSTED</div>
                                            ) : (
                                                <div style={{
                                                    background: g.status === 'Direct' ? "rgba(255,68,68,0.2)" : "rgba(255,215,0,0.1)",
                                                    color: g.status === 'Direct' ? "#ff4444" : "#ffd700",
                                                    border: g.status === 'Direct' ? "1px solid #ff4444" : "1px solid #ffd700",
                                                    padding:"4px 10px", borderRadius:6, fontSize:10, fontWeight:"bold"
                                                }}>
                                                    {g.status === 'Direct' ? "⚠️ Direct" : "🤝 Perlu MM"}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{fontSize:12, color:"#aaa", margin:"10px 0"}}>Oleh: <b>{g.nama}</b> • Via: {g.payment}</div>

                                        <div style={{display:"flex", gap:8, marginTop:10}}>
                                            <button onClick={()=>{
                                                const txt = `Halo ${g.nama}, saya minat Gold Market: ${g.tipe} ${g.jumlah} (Rp ${g.harga}).`;
                                                window.open(`https://wa.me/${g.wa}?text=${encodeURIComponent(txt)}`, "_blank");
                                            }} style={{flex:2, background:"#25D366", border:"none", borderRadius:8, color:"white", padding:10, fontSize:13, fontWeight:"bold"}}>💬 Chat Seller</button>
                                            
                                            {!g.is_trusted && (
                                                <button onClick={()=>setIsMMListOpen(true)} style={{flex:1, background:"#333", color:"#ffd700", border:"1px solid #ffd700", borderRadius:8, fontSize:12}}>🛡️ List MM</button>
                                            )}
                                            
                                            <button onClick={()=>setDeleteModal({show: true, tokenInput: ""})} style={{background:"rgba(255,255,255,0.05)", border:"none", borderRadius:8, color:"#666", padding:"0 15px"}}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                                {goldData.length === 0 && <div style={{textAlign:"center", color:"#444", padding:40}}>Belum ada iklan hari ini.</div>}
                            </div>
                        )}
                    </>
                )}

                {goldView === 'form' && (
                    <div style={{display:"flex", flexDirection:"column", gap:15}}>
                        <div style={{display:"flex", gap:10, background: "#1a1a1a", padding: 5, borderRadius: 12}}>
                             <button onClick={()=>setGoldForm({...goldForm, tipe:"JUAL"})} style={{flex:1, padding:12, background: goldForm.tipe==="JUAL"?"#4caf50":"transparent", color:"white", border:"none", borderRadius:10, fontWeight:"bold"}}>SAYA JUAL</button>
                            <button onClick={()=>setGoldForm({...goldForm, tipe:"BELI"})} style={{flex:1, padding:12, background: goldForm.tipe==="BELI"?"#f44336":"transparent", color:"white", border:"none", borderRadius:10, fontWeight:"bold"}}>SAYA BELI</button>
                        </div>

                        <input placeholder="Nama Anda / Nickname" value={goldForm.nama} onChange={e=>setGoldForm({...goldForm, nama:e.target.value})} style={styles.input} />
                        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                            <input placeholder="Jumlah Gold (cth: 3kk)" value={goldForm.jumlah} onChange={e=>setGoldForm({...goldForm, jumlah:e.target.value})} style={styles.input} />
                             <input type="number" placeholder="Harga Rp (Angka)" value={goldForm.harga} onChange={e=>setGoldForm({...goldForm, harga:e.target.value})} style={styles.input} />
                        </div>
                        <input placeholder="Metode Pembayaran (Dana, BCA, dll)" value={goldForm.payment} onChange={e=>setGoldForm({...goldForm, payment:e.target.value})} style={styles.input} />
                        
                        <div>
                            <label style={{color:"#888", fontSize:12, display:"block", marginBottom:10}}>Pilih Status Transaksi:</label>
                            <div style={{display:"grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10}}>
                                <button onClick={()=>setGoldForm({...goldForm, status: "Direct"})} style={{padding: 10, borderRadius: 8, fontSize: 11, fontWeight: "bold", border: "1px solid #ff4444", background: goldForm.status === "Direct" ? "#ff4444" : "transparent", color: goldForm.status === "Direct" ? "#fff" : "#ff4444"}}>⚠️ DIRECT</button>
                                <button onClick={()=>setGoldForm({...goldForm, status: "Perlu MM"})} style={{padding: 10, borderRadius: 8, fontSize: 11, fontWeight: "bold", border: "1px solid #ffd700", background: goldForm.status === "Perlu MM" ? "#ffd700" : "transparent", color: goldForm.status === "Perlu MM" ? "#000" : "#ffd700"}}>🤝 PERLU MM</button>
                                <button onClick={()=>setGoldForm({...goldForm, status: "Trusted"})} style={{padding: 10, borderRadius: 8, fontSize: 11, fontWeight: "bold", border: "1px solid #1da1f2", background: goldForm.status === "Trusted" ? "#1da1f2" : "transparent", color: goldForm.status === "Trusted" ? "#fff" : "#1da1f2"}}>🛡️ TRUSTED</button>
                            </div>
                        </div>

                        <div style={{display:"flex", gap:10, marginTop:10}}>
                             <button onClick={()=>setGoldView('list')} style={{flex:1, padding:15, background:"transparent", border:"1px solid #444", color:"#888", borderRadius:12}}>Batal</button>
                            <button onClick={handlePostGold} disabled={goldLoading} style={{flex:2, padding:15, background:"#FFD700", border:"none", color:"#000", borderRadius:12, fontWeight:"bold"}}>{goldLoading ? "Memproses..." : "SUBMIT IKLAN"}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
        /* PART 7B: All Modals, Toast & Closing */

      {/* === CUSTOM MODAL: LIST MM (GOLD MARKET) === */}
      {isMMListOpen && (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, maxWidth: 350, border: "1px solid #ffd700"}}>
                <h3 style={{marginTop:0, color:"#ffd700"}}>🛡️ Admin MM Resmi</h3>
                <p style={{fontSize:12, color:"#aaa"}}>Gunakan jasa MM resmi untuk menghindari penipuan.</p>
                <div style={{display:"flex", flexDirection:"column", gap:10, margin: "20px 0"}}>
                    {mmList.map((mm, i) => (
                        <div key={i} onClick={()=>window.open(`https://wa.me/${mm.wa}?text=Halo%20${mm.nama},%20mau%20pakai%20jasa%20MM.`, "_blank")} style={{background:"#222", padding:12, borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", border: "1px solid #333"}}>
                            <div>
                                <div style={{fontWeight:"bold", color:"#fff"}}>{mm.nama}</div>
                                <div style={{fontSize:10, color: mm.status === 'Online' ? '#4caf50' : '#888'}}>● {mm.status}</div>
                            </div>
                            <div style={{fontSize:20}}>💬</div>
                        </div>
                    ))}
                    {mmList.length === 0 && <div style={{textAlign:"center", color:"#555"}}>Belum ada admin MM.</div>}
                </div>
                <button onClick={()=>setIsMMListOpen(false)} style={{width:"100%", padding:12, background:"#333", color:"#fff", border:"none", borderRadius:8}}>Tutup</button>
            </div>
        </div>
      )}

      {/* === CUSTOM MODAL: SUKSES POST (DENGAN COPY TOKEN) === */}
      {successModal.show && (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, maxWidth: 320, textAlign: "center", border: "2px solid #4caf50"}}>
                <div style={{fontSize: 60, marginBottom: 15}}>✅</div>
                <h2 style={{marginTop:0, color:"#4caf50"}}>IKLAN TAYANG!</h2>
                <p style={{fontSize:13, color:"#aaa"}}>Simpan kode ini untuk menghapus iklan Anda nanti:</p>
                <div style={{background: "#000", padding: 20, borderRadius: 12, fontSize: 32, fontWeight: "900", letterSpacing: 5, color: "#ffd700", margin: "15px 0", border: "1px dashed #4caf50", position:"relative"}}>
                    {successModal.token}
                </div>
                <button onClick={() => {
                    navigator.clipboard.writeText(successModal.token);
                    showToast("Token disalin ke clipboard!", "success");
                }} style={{background:"#222", color:"#fff", border:"1px solid #444", padding:"8px 15px", borderRadius:6, fontSize:12, marginBottom: 20}}>📋 Salin Kode</button>
                <button onClick={()=>setSuccessModal({show: false, token: ""})} style={{width:"100%", padding:14, background:"#4caf50", color:"#fff", border:"none", borderRadius:10, fontWeight:"bold"}}>MENGERTI</button>
            </div>
        </div>
      )}

      {/* === CUSTOM MODAL: HAPUS IKLAN (PENGGANTI PROMPT) === */}
      {deleteModal.show && (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, maxWidth: 320, textAlign: "center", border: "1px solid #ff4444"}}>
                <h3 style={{marginTop:0, color:"#ff4444"}}>Hapus Iklan?</h3>
                <p style={{fontSize:12, color:"#aaa"}}>Masukkan 4 digit kode token iklan Anda untuk menghapus.</p>
                <input 
                    type="number" 
                    placeholder="Kode Token (4 Digit)" 
                    value={deleteModal.tokenInput}
                    onChange={(e)=>setDeleteModal({...deleteModal, tokenInput: e.target.value})}
                    style={{...styles.input, textAlign:"center", fontSize:24, letterSpacing:8, margin:"15px 0"}}
                />
                <div style={{display:"flex", gap:10}}>
                    <button onClick={()=>setDeleteModal({show: false, tokenInput: ""})} style={{flex:1, padding:12, background:"transparent", border:"1px solid #444", color:"#888", borderRadius:8}}>Batal</button>
                    <button onClick={handleDeleteGold} disabled={!deleteModal.tokenInput} style={{flex:1, padding:12, background:"#ff4444", color:"#fff", border:"none", borderRadius:8, fontWeight:"bold"}}>HAPUS</button>
                </div>
            </div>
        </div>
      )}

      {/* === MODAL VERIFIKASI BIN (AUCTION) === */}
      {isBinModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 500, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <div style={{ background: theme.cardBg, border: "2px solid #FFD700", borderRadius: 12, padding: 25, maxWidth: 350, width: "100%", textAlign: "center", boxShadow: "0 0 30px rgba(255, 215, 0, 0.3)" }}>
                <h2 style={{ color: "#FFD700", marginTop: 0 }}>🔐 Verifikasi BIN</h2>
                <p style={{ color: theme.text, fontSize: 14 }}>Untuk mencegah <i>Hit & Run</i>, silahkan minta <b>Kode Konfirmasi</b> ke Admin via WhatsApp.</p>
                <div style={{ margin: "20px 0", background: "rgba(255,255,255,0.05)", padding: 10, borderRadius: 8 }}><div style={{fontSize: 12, color: "#aaa"}}>Item yang akan di-BIN:</div><div style={{fontWeight: "bold", fontSize: 16, color: theme.text}}>{auctionData.item}</div><div style={{fontSize: 20, color: "#25D366", fontWeight: "bold", marginTop: 5}}>{formatGold(auctionData.binPrice)}</div></div>
                <button onClick={requestBinCode} style={{ width: "100%", padding: "12px", background: "#25D366", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", marginBottom: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span>💬 Minta Kode ke WhatsApp</span></button>
                <input placeholder="Masukkan Kode dari Admin..." value={binCode} onChange={(e) => setBinCode(e.target.value)} style={{ ...styles.input, textAlign: "center", fontSize: 18, letterSpacing: 2, textTransform: "uppercase" }} />
                <div style={{ display: "flex", gap: 10 }}><button onClick={() => setIsBinModalOpen(false)} style={{ flex: 1, padding: 12, background: "transparent", border: "1px solid #555", color: theme.text, borderRadius: 8, cursor: "pointer" }}>Batal</button><button onClick={() => handleBid("BIN", binCode)} disabled={bidLoading || !binCode} style={{ flex: 1, padding: 12, background: "#FFD700", border: "none", color: "black", borderRadius: 8, fontWeight: "bold", cursor: (bidLoading || !binCode) ? "not-allowed" : "pointer", opacity: (!binCode) ? 0.5 : 1 }}>{bidLoading ? "Loading..." : "🔒 KONFIRMASI"}</button></div>
            </div>
        </div>
      )}

      {/* CART MODAL */}
      {cartOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", justifyContent: "end" }}>
           <div style={{ width: "70%", maxWidth: 320, background: theme.modalBg, height: "100%", padding: 20, overflowY: "auto", borderLeft: theme.border, cursor: "default" }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}><h2>Keranjang</h2><button onClick={() => setCartOpen(false)} style={{background:"transparent", border:"none", color: theme.text, fontSize: 24}}>✕</button></div>
              {cart.map(c => (<div key={c.key} style={{marginBottom: 15, paddingBottom: 15, borderBottom: "1px solid #333"}}><div style={{fontWeight:"bold"}}>{c.nama} ({c.mode})</div><div style={{fontSize:11, color: theme.subText}}>Kategori: {c.kategori}</div><div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 8}}><div>{formatGold(c.mode === 'buy' ? c.buy : c.sell)} x {c.qty}</div><div style={{display:"flex", gap: 10}}><button onClick={() => updateQty(c, c.qty - 1)}>-</button><button onClick={() => updateQty(c, c.qty + 1)}>+</button><button onClick={() => removeFromCart(c)} style={{background:"red", color:"white", border:"none", borderRadius:4}}>Hapus</button></div></div></div>))}
              <div style={{marginTop: 20, paddingTop: 20, borderTop: "2px solid #555"}}><h4 style={{marginBottom: 10}}>Data Pembeli</h4><input placeholder="Nickname In-Game (IGN) *" value={ign} onChange={(e) => {setIgn(e.target.value); localStorage.setItem("gearShopIGN", e.target.value)}} style={styles.input} /><input placeholder="Nomor WhatsApp (Ex: 08123456789)" type="tel" value={waNumber} onChange={(e) => {setWaNumber(e.target.value); localStorage.setItem("gearShopWA", e.target.value)}} style={styles.input} /><div style={{display:"flex", justifyContent:"space-between", fontSize: 18, fontWeight:"bold", marginTop: 10}}><span>Total:</span><span>{formatGold(totalPrice)}</span></div><button onClick={handleCheckoutClick} style={{...styles.btn, width: "100%", background: "#25D366", padding: 15, marginTop: 20, fontSize: 16}}>WhatsApp Checkout 🚀</button></div>
           </div>
        </div>
      )}
      
     {/* === CONFIRMATION MODAL (CHECKOUT) === */}
      {confirmOpen && (
          <div onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(5px)" }}>
              <div style={{ background: theme.cardBg, width: "100%", maxWidth: 400, borderRadius: 16, padding: 25, border: "1px solid #444", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                  <h2 style={{marginTop: 0, textAlign: "center", color: "#FFD700"}}>📝 Konfirmasi Order</h2>
                  <p style={{textAlign:"center", fontSize: 12, color: "#aaa"}}>Pastikan data pesanan sudah benar sebelum lanjut ke WhatsApp.</p>
                  
                  <div style={{background: "rgba(255,255,255,0.03)", padding: 15, borderRadius: 12, margin: "15px 0", maxHeight: 200, overflowY: "auto", border: "1px solid #333"}}>
                      {cart.map((c, i) => (
                          <div key={i} style={{fontSize: 13, marginBottom: 8, borderBottom: "1px dashed #444", paddingBottom: 8, display:"flex", justifyContent:"space-between"}}>
                              <span>{c.nama} <span style={{color: c.mode==='buy'?"#4caf50":"#ffa500"}}>({c.mode})</span></span>
                              <span style={{fontWeight:"bold"}}>x{c.qty}</span>
                          </div>
                      ))}
                  </div>
                  
                  <div style={{display:"flex", justifyContent:"space-between", fontSize: 18, fontWeight:"bold", marginBottom: 20, background: "#222", padding: 10, borderRadius: 8}}>
                      <span>Total Bayar:</span>
                      <span style={{color: "#FFD700"}}>{totalPrice.toLocaleString('id-ID')} 🪙</span>
                  </div>
                  
                  <div style={{display: "flex", gap: 10}}>
                      <button onClick={() => setConfirmOpen(false)} style={{flex: 1, padding: 12, background: "transparent", border: "1px solid #555", color: theme.text, borderRadius: 8, cursor: "pointer"}}>Batal</button>
                      <button onClick={processToWA} style={{flex: 1, padding: 12, background: "#25D366", border: "none", color: "white", borderRadius: 8, fontWeight: "bold", cursor: "pointer"}}>Lanjut WA ➤</button>
                  </div>
              </div>
          </div>
      )}

      {/* === MODAL KONFIRMASI BID MODERN (FIXED) === */}
      {bidConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 600, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <div style={{ background: theme.cardBg, border: "2px solid #FFD700", borderRadius: 16, padding: 25, maxWidth: 350, width: "100%", textAlign: "center", boxShadow: "0 0 40px rgba(255, 215, 0, 0.2)" }}>
                <div style={{fontSize: 50, marginBottom: 10}}>🚀</div>
                <h2 style={{ color: "#FFD700", margin: "0 0 10px 0" }}>Konfirmasi Bid</h2>
                
                <div style={{background: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 10, margin: "15px 0"}}>
                    <div style={{fontSize: 12, color: "#aaa", textTransform: "uppercase"}}>Nominal Bid</div>
                    <div style={{fontSize: 28, fontWeight: "bold", color: "#fff"}}>{bidConfirm.amount.toLocaleString('id-ID')} 🪙</div>
                </div>

                <div style={{ fontSize: 13, color: theme.subText, marginBottom: 25, lineHeight: "1.5", background: "rgba(255, 165, 0, 0.1)", padding: 10, borderRadius: 8, border: "1px dashed #FFA500" }}>
                    ⚠️ <b>Harap Tunggu!</b><br/>
                    Setelah klik tombol di bawah, data butuh waktu <b>3-5 detik</b> untuk masuk ke Server. Jangan tutup halaman ya.
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setBidConfirm(null)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid #555", color: theme.text, borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
                        Batal
                    </button>
                    <button onClick={executeBid} style={{ flex: 1, padding: "12px", background: "linear-gradient(45deg, #FFD700, #FFA500)", border: "none", color: "black", borderRadius: 8, fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)" }}>
                        GAS! 🚀
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* === TOAST NOTIFICATION === */}
      {toast.show && (
        <div style={{
            position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
            background: toast.type === "error" ? "#D32F2F" : "#388E3C",
            color: "#fff", padding: "12px 24px", borderRadius: 50,
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)", zIndex: 9999, fontWeight: "bold",
            display: "flex", alignItems: "center", gap: 10, minWidth: 200, justifyContent: "center",
            animation: "fadeIn 0.3s ease-out"
        }}>
            <span style={{fontSize: 18}}>{toast.type === "error" ? "⚠️" : "✅"}</span> 
            {toast.msg}
        </div>
      )}
    </div>
  );
                  }
                                 
