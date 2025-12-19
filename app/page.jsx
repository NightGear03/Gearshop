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

  /* ===== FILTER ===== */
  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items
    .filter(i => {
      const nameMatch = i.nama.toLowerCase().includes(search.toLowerCase());
      const catMatch = category === "All" || i.kategori === category;
      return nameMatch && catMatch;
    })
    .sort((a,b)=>{
      if(sort==="buy-asc") return a.buy-b.buy;
      if(sort==="buy-desc") return b.buy-a.buy;
      if(sort==="sell-asc") return a.sell-b.sell;
      if(sort==="sell-desc") return b.sell-a.sell;
      return 0;
    });

  /* ===== STATUS ===== */
  const statusLabel = s => {
    const v = s?.toLowerCase();
    if(v==="full") return "🟢 Full";
    if(v==="ready") return "🔵 Ready";
    if(v==="take") return "🟡 Take";
    if(v==="kosong") return "🔴 Kosong";
    return s;
  };

  const canBuy  = s => ["full","ready"].includes(s?.toLowerCase());
  const canSell = s => ["ready","take"].includes(s?.toLowerCase());

  /* ===== CART ===== */
  const addToCart = (item, mode) => {
    if(item.status?.toLowerCase()==="kosong") return;
    const key = `${item.nama}-${mode}`;
    const exist = cart.find(c=>c.key===key);

    if(exist){
      setCart(cart.map(c=>c.key===key?{...c,qty:c.qty+1}:c));
    } else {
      setCart([...cart,{...item,mode,qty:1,key}]);
    }
    setCartOpen(true);
  };

  const updateQty = (item,qty)=>{
    if(qty<1) return;
    setCart(cart.map(c=>c.key===item.key?{...c,qty}:c));
  };

  const removeFromCart = item =>{
    setCart(cart.filter(c=>c.key!==item.key));
  };

  const totalPrice = cart.reduce(
    (s,c)=>s+(c.mode==="buy"?c.buy:c.sell)*c.qty,0
  );

  const sendWA = ()=>{
    if(!cart.length) return;
    const text = cart.map(
      c=>`${c.nama} (${c.mode}) x${c.qty} = ${(c.mode==="buy"?c.buy:c.sell)*c.qty}`
    ).join("%0A");

    window.open(
      `https://wa.me/6283101456267?text=Halo,%20saya%20mau%20order:%0A${text}%0ATotal:%20${totalPrice}`,
      "_blank"
    );
  };

  /* ===== UI ===== */
  return (
    <>
      {/* HEADER */}
      <header style={header}>
        <img src="/logo.png" height={40} />
        <div style={cartIcon} onClick={()=>setCartOpen(true)}>
          🛒
          {cart.length>0 && <span style={cartBadge}>{cart.length}</span>}
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
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...input,width:140}}>
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
          filteredItems.map((i,idx)=>(
            <div key={idx} style={card}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <strong>{i.nama}</strong>
                <span onClick={()=>setWishlist(
                  wishlist.includes(i.nama)
                  ? wishlist.filter(w=>w!==i.nama)
                  : [...wishlist,i.nama]
                )}>
                  {wishlist.includes(i.nama)?"❤️":"🤍"}
                </span>
              </div>

              <div style={{fontSize:13,color:"#666"}}>{i.kategori}</div>
              <div>Buy: {i.buy}</div>
              <div>Sell: {i.sell}</div>
              {i.promo && <div style={promo}>{i.promo}</div>}
              <div>Status: {statusLabel(i.status)}</div>

              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button disabled={!canBuy(i.status)} style={{...btn,background:canBuy(i.status)?"#25D366":"#ccc"}}
                  onClick={()=>addToCart(i,"buy")}>Beli</button>
                <button disabled={!canSell(i.status)} style={{...btn,background:canSell(i.status)?"#FF8C00":"#ccc"}}
                  onClick={()=>addToCart(i,"sell")}>Jual</button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* CART */}
      <div style={{
        ...cartPanel,
        transform:cartOpen?"translateX(0)":"translateX(100%)"
      }}>
        <button onClick={()=>setCartOpen(false)}>✖</button>
        <h3>Keranjang</h3>

        {cart.map(c=>(
          <div key={c.key} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{flex:1}}>{c.nama} ({c.mode})</span>
            <input type="number" value={c.qty} onChange={e=>updateQty(c,parseInt(e.target.value))} style={{width:50}}/>
            <span>{(c.mode==="buy"?c.buy:c.sell)*c.qty}</span>
            <button onClick={()=>removeFromCart(c)}>X</button>
          </div>
        ))}

        {cart.length>0 && (
          <button style={{...btn,background:"#25D366",marginTop:10}} onClick={()=>setConfirmOpen(true)}>
            Checkout WA
          </button>
        )}
      </div>

      {cartOpen && <div style={backdrop} onClick={()=>setCartOpen(false)} />}

      {confirmOpen && (
        <div style={modalWrap}>
          <div style={modal}>
            <h3>Konfirmasi</h3>
            <div>Total: {totalPrice}</div>
            <button style={{...btn,background:"#25D366"}} onClick={()=>{sendWA();setConfirmOpen(false)}}>
              Lanjut WA
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== STYLE ===== */
const header={background:"#3C6EE2",padding:12,display:"flex",justifyContent:"space-between"};
const cartIcon={position:"relative",cursor:"pointer"};
const cartBadge={position:"absolute",top:-6,right:-6,background:"red",color:"#fff",borderRadius:"50%",padding:"2px 6px",fontSize:12};
const input={width:"100%",padding:10,marginBottom:12,borderRadius:8,border:"1px solid #ccc"};
const card={border:"1px solid #ddd",borderRadius:10,padding:12,marginBottom:10};
const promo={background:"#FFD700",padding:"2px 6px",borderRadius:4,fontSize:12};
const btn={flex:1,color:"#fff",border:"none",padding:10,borderRadius:8};
const cartPanel={position:"fixed",top:0,right:0,width:300,height:"100%",background:"#fff",padding:16,boxShadow:"-2px 0 8px rgba(0,0,0,.2)",transition:"0.3s",zIndex:999};
const backdrop={position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:998};
const modalWrap={position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",zIndex:1000};
const modal={background:"#fff",padding:20,borderRadius:10};
