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

  /* ================= LOAD DATA ================= */
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

  /* ================= FILTER ================= */
  const categories = ["All", ...new Set(items.map(i => i.kategori))];

  const filteredItems = items
    .filter(i =>
      i.nama.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All" || i.kategori === category)
    )
    .sort((a,b)=>{
      if(sort==="buy-asc") return a.buy-b.buy;
      if(sort==="buy-desc") return b.buy-a.buy;
      if(sort==="sell-asc") return a.sell-b.sell;
      if(sort==="sell-desc") return b.sell-a.sell;
      return 0;
    });

  /* ================= STATUS ================= */
  const statusColor = s => {
    const v = s?.toLowerCase();
    if(v==="ready") return "#22c55e";
    if(v==="take") return "#facc15";
    if(v==="full") return "#3b82f6";
    if(v==="kosong") return "#9ca3af";
    return "#6b7280";
  };

  const canBuy = s => ["ready","full"].includes(s?.toLowerCase());
  const canSell = s => ["ready","take"].includes(s?.toLowerCase());

  /* ================= CART ================= */
  const addToCart = (item, mode) => {
    if(item.status?.toLowerCase()==="kosong") return;
    const key = `${item.nama}-${mode}`;
    const exist = cart.find(c=>c.key===key);
    if(exist){
      setCart(cart.map(c=>c.key===key?{...c,qty:c.qty+1}:c));
    } else {
      setCart([...cart,{...item,qty:1,mode,key}]);
    }
    setCartOpen(true);
  };

  const total = cart.reduce(
    (s,c)=>s + (c.mode==="buy"?c.buy:c.sell)*c.qty,0
  );

  const sendWA = () => {
    const text = cart.map(c=>
      `${c.nama} (${c.mode}) x${c.qty}`
    ).join("%0A");
    window.open(
      `https://wa.me/6283101456267?text=Halo%20saya%20order:%0A${text}%0ATotal:%20${total}`,
      "_blank"
    );
  };

  /* ================= UI ================= */
  return (
    <>
      {/* HEADER */}
      <header style={header}>
        <img src="/logo.png" height={36}/>
        <div onClick={()=>setCartOpen(true)} style={{cursor:"pointer"}}>
          🛒 {cart.length>0 && <span style={badge}>{cart.length}</span>}
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
          <select value={category} onChange={e=>setCategory(e.target.value)} style={input}>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={input}>
            <option value="default">Sort</option>
            <option value="buy-asc">Buy ↑</option>
            <option value="buy-desc">Buy ↓</option>
            <option value="sell-asc">Sell ↑</option>
            <option value="sell-desc">Sell ↓</option>
          </select>
        </div>

        {loading ? <div style={{padding:20,textAlign:"center"}}>Loading...</div> :
          filteredItems.map(item=>(
            <div key={item.nama} style={card}>
              <div style={imgWrap}>
                <img
                  src={item.image || "/no-image.png"}
                  onError={e=>e.currentTarget.src="/no-image.png"}
                  style={img}
                />
              </div>

              <div style={{padding:12}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <strong>{item.nama}</strong>
                  <span style={{
                    background:statusColor(item.status),
                    color:"#fff",
                    padding:"2px 8px",
                    borderRadius:999,
                    fontSize:11
                  }}>{item.status}</span>
                </div>

                <div style={{fontSize:13,color:"#666"}}>{item.kategori}</div>

                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span>Buy: {item.buy}</span>
                  <span>Sell: {item.sell}</span>
                </div>

                {item.promo && <div style={promo}>{item.promo}</div>}

                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button disabled={!canBuy(item.status)} onClick={()=>addToCart(item,"buy")} style={btnBuy}>Beli</button>
                  <button disabled={!canSell(item.status)} onClick={()=>addToCart(item,"sell")} style={btnSell}>Jual</button>
                </div>
              </div>
            </div>
          ))
        }
      </main>

      {/* CART */}
      {cartOpen && (
        <>
          <div onClick={()=>setCartOpen(false)} style={backdrop}/>
          <div style={cartBox}>
            <strong>Keranjang</strong>
            {cart.map(c=>(
              <div key={c.key} style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                <span>{c.nama} ({c.mode}) x{c.qty}</span>
                <span>{(c.mode==="buy"?c.buy:c.sell)*c.qty}</span>
              </div>
            ))}
            <button onClick={sendWA} style={checkout}>Checkout WA</button>
          </div>
        </>
      )}
    </>
  );
}

/* ================= STYLE ================= */
const header={background:"#3C6EE2",padding:12,display:"flex",justifyContent:"space-between",color:"#fff"};
const badge={background:"red",borderRadius:"50%",padding:"2px 6px",fontSize:12};
const input={flex:1,padding:10,borderRadius:8,border:"1px solid #ccc"};
const card={border:"1px solid #ddd",borderRadius:14,overflow:"hidden",marginTop:12};
const imgWrap={width:"100%",aspectRatio:"16/9",background:"#eee"};
const img={width:"100%",height:"100%",objectFit:"cover"};
const promo={background:"#FFD700",display:"inline-block",padding:"2px 6px",borderRadius:4,fontSize:12};
const btnBuy={flex:1,background:"#22c55e",color:"#fff",border:"none",padding:10,borderRadius:8};
const btnSell={flex:1,background:"#f97316",color:"#fff",border:"none",padding:10,borderRadius:8};
const backdrop={position:"fixed",inset:0,background:"rgba(0,0,0,.4)"};
const cartBox={position:"fixed",bottom:0,left:0,right:0,background:"#fff",padding:16,borderTopLeftRadius:16,borderTopRightRadius:16};
const checkout={marginTop:12,width:"100%",padding:12,background:"#25D366",color:"#fff",border:"none",borderRadius:10};
