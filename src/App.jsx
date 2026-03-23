import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

function createId(){
  return Math.random().toString(36).substring(2,9);
}

export default function TierListApp(){

  const [tiers,setTiers] = useState([
    {id:"S",label:"S",color:"bg-red-500",items:[]},
    {id:"A",label:"A",color:"bg-orange-400",items:[]},
    {id:"B",label:"B",color:"bg-yellow-300",items:[]},
    {id:"C",label:"C",color:"bg-green-400",items:[]},
    {id:"D",label:"D",color:"bg-blue-400",items:[]}
  ]);

  const [pool,setPool] = useState([]);
  const [text,setText] = useState("");
  const [packs,setPacks] = useState({});
  const [currentPack,setCurrentPack] = useState("default");

  const tierRef = useRef();

  // Drag & Drop функции
  const onDragStart=(e,item,fromTier)=>{
    e.dataTransfer.setData("item",JSON.stringify({item,fromTier}));
  };

  const removeFromAll=(itemId)=>{
    setPool(p=>p.filter(i=>i.id!==itemId));
    setTiers(t=>t.map(tier=>({ ...tier, items:tier.items.filter(i=>i.id!==itemId) })));
  };

  const deleteItem=(itemId)=>{
    removeFromAll(itemId);
  };

  const moveItem=(item,fromTier,toTier)=>{
    if(fromTier === "pool") setPool(p=>p.filter(i=>i.id!==item.id));
    if(fromTier !== "pool") setTiers(t=>t.map(tier=> tier.id===fromTier ? {...tier,items:tier.items.filter(i=>i.id!==item.id)} : tier ));
    setTiers(t=>t.map(tier=> tier.id===toTier ? {...tier,items:[...tier.items,item]} : tier ));
  };

  const onDrop=(e,tierId)=>{
    e.preventDefault();
    const {item,fromTier} = JSON.parse(e.dataTransfer.getData("item"));
    moveItem(item,fromTier,tierId);
  };

  const allowDrop=(e)=>e.preventDefault();

  // Добавление изображений и текста
  const uploadImage=(e)=>{
    const file=e.target.files[0];
    if(!file) return;
    const url=URL.createObjectURL(file);
    const newItem={ id:createId(), type:"image", src:url };
    setPool(p=>[...p,newItem]);
    setPacks(prev=>({ ...prev, [currentPack]: [...(prev[currentPack] || []), newItem] }));
  };

  const addText=()=>{
    if(!text.trim()) return;
    const newItem={ id:createId(), type:"text", text };
    setPool(p=>[...p,newItem]);
    setPacks(prev=>({ ...prev, [currentPack]: [...(prev[currentPack] || []), newItem] }));
    setText("");
  };

  const createPack=()=>{
    const name=prompt("Pack name:");
    if(!name) return;
    setPacks(p=>({...p,[name]:[]}));
  };

  const loadPack=(name)=>{
    setCurrentPack(name);
    setPool(packs[name] || []);
  };

  // Управление тир
  const editTier=(tierId)=>{
    const newName=prompt("New tier label:");
    if(!newName) return;
    setTiers(t=>t.map(tier=> tier.id===tierId ? {...tier,label:newName} : tier ));
  };

  const addTier=()=>{
    const name=prompt("Tier name:");
    if(!name) return;
    setTiers(t=>[ ...t, {id:createId(),label:name,color:"bg-zinc-500",items:[]} ]);
  };

  const deleteTier=(tierId)=>{
    setTiers(t=>t.filter(tier=>tier.id!==tierId));
  };

  // Firestore: сохранение и загрузка онлайн
  const saveTierListOnline = async () => {
    try {
      await setDoc(doc(db, "tierlists", currentPack), {
        tiers,
        pool,
        timestamp: Date.now()
      });
      alert("Сохранено онлайн!");
    } catch (e) {
      console.error("Ошибка сохранения:", e);
    }
  };

  const loadTierListOnline = async () => {
    try {
      const docSnap = await getDoc(doc(db, "tierlists", currentPack));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTiers(data.tiers);
        setPool(data.pool);
        alert("Загружено онлайн!");
      } else {
        alert("Пак не найден");
      }
    } catch (e) {
      console.error("Ошибка загрузки:", e);
    }
  };

  // Экспорт PNG
  const exportPNG=async()=>{
    const canvas = await html2canvas(tierRef.current, { scale: 2, backgroundColor: null, useCORS: true });
    const link = document.createElement("a");
    link.download = "tierlist.png";
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  // Рендер элементов
  const renderItem=(item,fromTier)=> (
    <div
      key={item.id}
      draggable
      onDragStart={(e)=>onDragStart(e,item,fromTier)}
      onContextMenu={(e)=>{e.preventDefault(); if(window.confirm("Delete this item?")) deleteItem(item.id);}}
      className="relative w-28 h-28 bg-transparent rounded-lg shadow-md hover:scale-105 transition flex items-center justify-center overflow-hidden cursor-grab border border-zinc-700"
    >
      {item.type === "image" ? (
        <img src={item.src} className="object-contain w-full h-full" />
      ) : (
        <span className="text-sm text-black text-center p-1">{item.text}</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Tier List Builder</h1>
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button onClick={saveTierListOnline} className="bg-green-600 px-4 py-2 rounded">Save Online</button>
          <button onClick={loadTierListOnline} className="bg-yellow-600 px-4 py-2 rounded">Load Online</button>
          <button onClick={exportPNG} className="bg-purple-500 px-4 py-2 rounded">Export PNG</button>
          <button onClick={createPack} className="bg-pink-500 px-4 py-2 rounded">New Pack</button>
          <button onClick={addTier} className="bg-zinc-600 px-4 py-2 rounded">Add Tier</button>
        </div>
        <div ref={tierRef} className="space-y-3 mb-10">
          {tiers.map(tier=>(
            <div key={tier.id} onDrop={(e)=>onDrop(e,tier.id)} onDragOver={allowDrop} className="flex rounded-xl overflow-hidden shadow-lg">
              <div className={`w-20 flex flex-col items-center justify-center font-bold text-2xl text-black ${tier.color}`}>
                <span onDoubleClick={()=>editTier(tier.id)} className="cursor-pointer">{tier.label}</span>
              </div>
              <div className="flex flex-wrap gap-2 p-3 min-h-[110px] bg-zinc-800 w-full">
                {tier.items.map(i=>renderItem(i,tier.id))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="file" onChange={uploadImage} className="text-sm" />
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Text item" className="bg-zinc-700 px-3 py-2 rounded-lg" />
            <button onClick={addText} className="bg-blue-500 px-4 py-2 rounded">Add</button>
          </div>
          <div className="flex flex-wrap gap-3" onDrop={(e)=>{
            e.preventDefault();
            const {item,fromTier}=JSON.parse(e.dataTransfer.getData("item"));
            if(fromTier!="pool"){
              setTiers(t=>t.map(tier=> tier.id===fromTier ? {...tier,items:tier.items.filter(i=>i.id!==item.id)} : tier ));
              setPool(p=>[...p,item]);
            }
          }} onDragOver={allowDrop}>
            {pool.map(i=>renderItem(i,"pool"))}
          </div>
        </div>
      </div>
    </div>
  );
}
