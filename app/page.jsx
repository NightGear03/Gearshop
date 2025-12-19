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
  const [wishlist, setWishlist] = useState([]);

  /* ===== LOAD DATA ===== */
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
            promo: c[5]?.trim() || null,
            image: c[6]?.trim() || null,
          };
        });

      setItems(parsed);
      setLoading(false);
    }
    loadData();
  }, []);

  /* ===== FILTER ===== */
  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items
    .filter(i =>
      i.nama?.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All" || i.kategori === category)
    )
    .sort((a,b) => {
      if(sort === "buy-asc") return a.buy - b.buy;
      if(sort === "buy-desc") return b.buy - a.buy;
      if(sort === "sell-asc") return a.sell - b.sell;
      if(sort === "sell-desc") return b.sell - a.sell;
      return 0;
    });

  /* ===== LOGIC ===== */
  const isBuyEnabled = s => ["full","ready"].includes(s?.toLowerCase());
  const isSellEnabled = s => ["ready","take"].includes(s?.toLowerCase());

  const addToCart = (item, mode) => {
    const key = `${item.nama}-${mode}`;
    const exist = cart.find(c => c.key === key);
    if (exist) {
      setCart(cart.map(c => c.key === key ? {...c, qty:c.qty+1} : c));
    } else {
      setCart([...cart, {...item, qty:1, mode, key}]);
    }
    setCartOpen(true);
  };

  const toggleWishlist = item => {
    setWishlist(
      wishlist.includes(item.nama)
        ? wishlist.filter(i => i !== item.nama)
        : [...wishlist, item.nama]
    );
  };

  /* ===== UI ===== */
  return (
    <>
      {/* HEADER */}
      <header style={header}>
        <img src="/logo.png" height={36} />
        <div style={{position:"relative"}} onClick={()=>setCartOpen(true)}>
          🛒
          {cart.length > 0 && <span style={cartBadge}>{cart.length}</span>}
        </div>
      </header>

      <main style={{padding:16}}>
        <input
          placeholder="Cari item..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={input}
        />

        <div style={{display:"flex",gap:8}}>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{...input,flex:1}}>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...input,width:120}}>
            <option value="default">Sort</option>
            <option value="buy-asc">Buy ↑</option>
            <option value="buy-desc">Buy ↓</option>
            <option value="sell-asc">Sell ↑</option>
            <option value="sell-desc">Sell ↓</option>
          </select>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:20}}>Loading...</div>
        ) : (
          filteredItems.map(item => (
            <div key={item.nama} style={card}>
              <div style={{display:"flex",gap:12}}>
                <div style={thumb}>
                  {item.image && (
                    <img
                      src={item.image}
                      style={thumbImg}
                      onError={e=>e.currentTarget.style.display="none"}
                    />
                  )}
                  <span style={heart} onClick={()=>toggleWishlist(item)}>
                    {wishlist.includes(item.nama)?"❤️":"🤍"}
                  </span>
                </div>

                <div style={{flex:1}}>
                  <strong>{item.nama}</strong>
                  <div style={{fontSize:13,color:"#666"}}>{item.kategori}</div>

                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span>Buy: {item.buy}</span>
                    <span>Sell: {item.sell}</span>
                  </div>

                  {item.promo && <div style={promo}>{item.promo}</div>}

                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button
                      disabled={!isBuyEnabled(item.status)}
                      onClick={()=>addToCart(item,"buy")}
                      style={{...btnGreen,opacity:isBuyEnabled(item.status)?1:.5}}
                    >
                      Beli
                    </button>
                    <button
                      disabled={!isSellEnabled(item.status)}
                      onClick={()=>addToCart(item,"sell")}
                      style={{...btnOrange,opacity:isSellEnabled(item.status)?1:.5}}
                    >
                      Jual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </>
  );
}

/* ===== STYLE ===== */
const header={background:"#3C6EE2",padding:12,display:"flex",justifyContent:"space-between",alignItems:"center"};
const cartBadge={position:"absolute",top:-6,right:-8,fontSize:11,background:"red",color:"#fff",borderRadius:"50%",padding:"2px 6px"};
const input={width:"100%",padding:10,borderRadius:8,border:"1px solid #ccc",marginBottom:12};
const card={background:"#fff",borderRadius:14,padding:12,marginBottom:12,border:"1px solid #ddd"};
const thumb={width:72,height:72,borderRadius:10,background:"#e5e7eb",position:"relative",overflow:"hidden"};
const thumbImg={width:"100%",height:"100%",objectFit:"cover"};
const heart={position:"absolute",top:4,right:6,fontSize:16};
const promo={background:"#FFD700",padding:"2px 6px",borderRadius:4,fontSize:12,marginTop:6,display:"inline-block"};
const btnGreen={flex:1,padding:10,borderRadius:8,border:"none",background:"#25D366",color:"#fff"};
const btnOrange={flex:1,padding:10,borderRadius:8,border:"none",background:"#FF8C00",color:"#fff"};
