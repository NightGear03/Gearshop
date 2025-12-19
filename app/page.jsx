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

  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items
    .filter(item => {
      const nameMatch = item.nama?.toLowerCase().includes(search.toLowerCase());
      const catMatch = category === "All" || item.kategori === category;
      return nameMatch && catMatch;
    })
    .sort((a,b) => {
      if(sort === "buy-asc") return a.buy - b.buy;
      if(sort === "buy-desc") return b.buy - a.buy;
      if(sort === "sell-asc") return a.sell - b.sell;
      if(sort === "sell-desc") return b.sell - a.sell;
      return 0;
    });

  const isBuyEnabled = s => ["full","ready"].includes(s?.toLowerCase());
  const isSellEnabled = s => ["ready","take"].includes(s?.toLowerCase());

  const toggleWishlist = item => {
    setWishlist(wishlist.includes(item.nama)
      ? wishlist.filter(i=>i!==item.nama)
      : [...wishlist,item.nama]
    );
  };

  return (
    <>
      <main style={{padding:16}}>
        <input
          placeholder="Cari item..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={inputStyle}
        />

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{...inputStyle,flex:1}}>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...inputStyle,width:140}}>
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
            <div key={item.nama + item.kategori} style={card}>
              
              {/* IMAGE ZONE (STABIL) */}
              <div style={imageWrap}>
                <img
                  src={item.image || "/no-image.png"}
                  alt={item.nama}
                  loading="lazy"
                  onError={e=>e.currentTarget.src="/no-image.png"}
                  style={{
                    ...imageStyle,
                    filter:item.status?.toLowerCase()==="kosong"?"grayscale(1)":"none"
                  }}
                />
                <span style={wishlistBtn} onClick={()=>toggleWishlist(item)}>
                  {wishlist.includes(item.nama)?"❤️":"🤍"}
                </span>
              </div>

              {/* CONTENT */}
              <div style={{padding:12}}>
                <strong>{item.nama}</strong>
                <div style={{fontSize:13,color:"#666"}}>{item.kategori}</div>

                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span>Buy: {item.buy}</span>
                  <span>Sell: {item.sell}</span>
                </div>

                {item.promo && <div style={promo}>{item.promo}</div>}

                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button disabled={!isBuyEnabled(item.status)} style={btnGreen}>Beli</button>
                  <button disabled={!isSellEnabled(item.status)} style={btnOrange}>Jual</button>
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

const inputStyle={width:"100%",padding:10,marginBottom:12,borderRadius:8,border:"1px solid #ccc"};

const card={
  border:"1px solid #ddd",
  borderRadius:14,
  overflow:"hidden",
  marginBottom:12,
  background:"#fff"
};

const imageWrap={
  width:"100%",
  aspectRatio:"16 / 9",
  background:"#f2f2f2",
  position:"relative"
};

const imageStyle={
  width:"100%",
  height:"100%",
  objectFit:"cover",
  display:"block"
};

const wishlistBtn={
  position:"absolute",
  top:8,
  right:8,
  fontSize:18,
  cursor:"pointer"
};

const promo={
  background:"#FFD700",
  display:"inline-block",
  padding:"2px 6px",
  borderRadius:4,
  fontSize:12,
  marginTop:6
};

const btnGreen={flex:1,padding:10,borderRadius:8,border:"none",background:"#25D366",color:"#fff"};
const btnOrange={flex:1,padding:10,borderRadius:8,border:"none",background:"#FF8C00",color:"#fff"};            image: c[6]?.trim() || null, // ⬅️ BARU
          };
        });

      setItems(parsed);
      setLoading(false);
    }
    loadData();
  }, []);

  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items
    .filter(item => {
      const nameMatch = item.nama?.toLowerCase().includes(search.toLowerCase());
      const catMatch = category === "All" || item.kategori === category;
      return nameMatch && catMatch;
    })
    .sort((a,b) => {
      if(sort === "buy-asc") return a.buy - b.buy;
      if(sort === "buy-desc") return b.buy - a.buy;
      if(sort === "sell-asc") return a.sell - b.sell;
      if(sort === "sell-desc") return b.sell - a.sell;
      return 0;
    });

  const isBuyEnabled = status => {
    const s = status?.toLowerCase();
    return s === "full" || s === "ready";
  };

  const isSellEnabled = status => {
    const s = status?.toLowerCase();
    return s === "ready" || s === "take";
  };

  const addToCart = (item, mode="buy") => {
    if(item.status?.toLowerCase() === "kosong") return;
    const key = `${item.nama}-${mode}`;
    const existing = cart.find(c=>c.key===key);

    if(existing){
      setCart(cart.map(c=>c.key===key?{...c, qty:c.qty+1}:c));
    } else {
      setCart([...cart,{...item,qty:1,mode,key}]);
    }
    setCartOpen(true);
  };

  const removeFromCart = (item) => {
    setCart(cart.filter(c=>c.key!==item.key));
  };

  const updateQty = (item, qty) => {
    if(qty < 1) return;
    setCart(cart.map(c=>c.key===item.key?{...c,qty}:c));
  };

  const toggleWishlist = (item) => {
    if(wishlist.includes(item.nama)){
      setWishlist(wishlist.filter(i=>i!==item.nama));
    } else {
      setWishlist([...wishlist,item.nama]);
    }
  };

  const totalPrice = cart.reduce(
    (sum,c)=>sum + (c.mode==="buy"?c.buy:c.sell)*c.qty,0
  );

  const sendWA = () => {
    if(!cart.length) return;
    const text = cart
      .map(c=>`${c.nama} (${c.mode}) x${c.qty} = ${c.mode==="buy"?c.buy*c.qty:c.sell*c.qty}`)
      .join("%0A");
    const msg = `Halo,%20saya%20mau%20order:%0A${text}%0ATotal: ${totalPrice}`;
    window.open(`https://wa.me/6283101456267?text=${msg}`,"_blank");
  };

  return (
    <>
      <header style={headerStyle}>
        <img src="/logo.png" height={40}/>
        <div style={{position:"relative",cursor:"pointer"}} onClick={()=>setCartOpen(true)}>
          🛒
          {cart.length>0 && (
            <span style={cartBadge}>{cart.length}</span>
          )}
        </div>
      </header>

      <main style={{padding:16}}>
        <input
          placeholder="Cari item..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={inputStyle}
        />

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{...inputStyle,flex:1}}>
            {categories.map((c,i)=><option key={i}>{c}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...inputStyle,width:140}}>
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
          filteredItems.map((item,i)=>(
            <div key={i} style={cardModern}>
              <div style={{position:"relative"}}>
                <img
                  src={item.image || "/no-image.png"}
                  alt={item.nama}
                  loading="lazy"
                  onError={(e)=>e.currentTarget.src="/no-image.png"}
                  style={{
                    width:"100%",
                    height:100,
                    objectFit:"cover",
                    filter:item.status?.toLowerCase()==="kosong"?"grayscale(1)":"none"
                  }}
                />

                <div style={imageOverlay}></div>

                <span style={statusBadge}>{item.status}</span>

                <span
                  style={wishlistBtn}
                  onClick={()=>toggleWishlist(item)}
                >
                  {wishlist.includes(item.nama)?"❤️":"🤍"}
                </span>
              </div>

              <div style={{padding:12}}>
                <strong>{item.nama}</strong>
                <div style={{fontSize:13,color:"#666"}}>{item.kategori}</div>

                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span>Buy: {item.buy}</span>
                  <span>Sell: {item.sell}</span>
                </div>

                {item.promo && <div style={promoStyle}>{item.promo}</div>}

                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button
                    onClick={()=>addToCart(item,"buy")}
                    disabled={!isBuyEnabled(item.status)}
                    style={{
                      ...waStyle,
                      background:isBuyEnabled(item.status)?"#25D366":"#ccc"
                    }}
                  >
                    Beli
                  </button>

                  <button
                    onClick={()=>addToCart(item,"sell")}
                    disabled={!isSellEnabled(item.status)}
                    style={{
                      ...waStyle,
                      background:isSellEnabled(item.status)?"#FF8C00":"#ccc"
                    }}
                  >
                    Jual
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* CART, BACKDROP, MODAL — TIDAK DIUBAH */}
      {/* (sama persis dengan kode lu sebelumnya) */}
    </>
  );
}

/* ===== STYLE ===== */

const headerStyle = {
  background:"#3C6EE2",
  padding:12,
  display:"flex",
  alignItems:"center",
  justifyContent:"space-between"
};

const cartBadge = {
  position:"absolute",
  top:-8,
  right:-8,
  background:"#FF3B30",
  color:"#fff",
  borderRadius:"50%",
  padding:"2px 6px",
  fontSize:12
};

const inputStyle = {
  width:"100%",
  padding:10,
  marginBottom:12,
  borderRadius:8,
  border:"1px solid #ccc"
};

const waStyle = {
  flex:1,
  color:"#fff",
  textAlign:"center",
  padding:10,
  borderRadius:8,
  fontWeight:"bold",
  cursor:"pointer",
  border:"none"
};

const promoStyle = {
  background:"#FFD700",
  color:"#000",
  display:"inline-block",
  padding:"2px 6px",
  borderRadius:4,
  fontSize:12,
  marginTop:6
};

const cardModern = {
  border:"1px solid #ddd",
  borderRadius:14,
  overflow:"hidden",
  marginBottom:12,
  background:"#fff"
};

const imageOverlay = {
  position:"absolute",
  inset:0,
  background:"linear-gradient(to top, rgba(0,0,0,0.5), transparent)"
};

const statusBadge = {
  position:"absolute",
  bottom:8,
  left:8,
  background:"#2563eb",
  color:"#fff",
  fontSize:12,
  padding:"2px 8px",
  borderRadius:999
};

const wishlistBtn = {
  position:"absolute",
  top:8,
  right:8,
  fontSize:18,
  cursor:"pointer"
};
