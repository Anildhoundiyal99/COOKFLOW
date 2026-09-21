import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const photo = (term, lock = 1) => `https://loremflickr.com/720/480/${encodeURIComponent(term)}?lock=${Math.abs(lock)}`;
const hash = (s) => [...String(s)].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);

const DATA = {
  ingredients: [
    ['🥔','Potato','Vegetable'],['🧅','Onion','Vegetable'],['🍅','Tomato','Vegetable'],['🥕','Carrot','Vegetable'],['🫑','Capsicum','Vegetable'],['🌽','Corn','Vegetable'],['🥦','Broccoli','Vegetable'],['🥬','Spinach','Vegetable'],['🥒','Cucumber','Vegetable'],['🍆','Eggplant','Vegetable'],['🫛','Green peas','Vegetable'],['🍠','Sweet potato','Vegetable'],['🥬','Cabbage','Vegetable'],['🧄','Garlic','Vegetable'],['🫚','Ginger','Vegetable'],['🌶️','Green chilli','Vegetable'],['🍋','Lemon','Fruit'],['🍌','Banana','Fruit'],['🍎','Apple','Fruit'],['🥭','Mango','Fruit'],['🍊','Orange','Fruit'],['🍚','Rice','Grain'],['🌾','Flour','Grain'],['🥣','Oats','Grain'],['🍞','Bread','Grain'],['🫘','Lentils','Pulse'],['🟤','Chana dal','Pulse'],['🟢','Moong dal','Pulse'],['🟡','Toor dal','Pulse'],['🧆','Chickpeas','Pulse'],['🫘','Kidney beans','Pulse'],['🥚','Egg','Protein'],['🧀','Paneer','Protein'],['🍗','Chicken','Protein'],['🐟','Fish','Protein'],['🥩','Mutton','Protein'],['🥛','Milk','Dairy'],['🧈','Butter','Dairy'],['🥣','Curd / Yogurt','Dairy'],['🧀','Cheese','Dairy'],['🥜','Peanuts','Nuts'],['🌰','Almonds','Nuts'],['🌿','Coriander','Herb'],['🌱','Mint','Herb'],['🫒','Olive oil','Pantry'],['🧂','Salt','Pantry'],['🌶️','Red chilli powder','Spice'],['🟤','Cumin','Spice'],['🟨','Turmeric','Spice'],['🟤','Garam masala','Spice'],['🟫','Black pepper','Spice'],['🟧','Cinnamon','Spice'],['🟫','Cloves','Spice'],['🟨','Cardamom','Spice'],['🥥','Coconut','Fruit'],['🥑','Avocado','Fruit'],['🍄','Mushroom','Vegetable'],['🧈','Ghee','Pantry']
  ],
  preferences: [
    ['⚡','Very quick','Time'],['⏱️','Under 20 min','Time'],['🕒','Under 30 min','Time'],['🍲','Comfort food','Style'],['🌿','Healthy','Style'],['🌶️','Spicy','Taste'],['🧂','Less salty','Taste'],['💪','High protein','Style'],['🥗','Light meal','Style'],['🍳','Breakfast','Meal'],['🍛','Lunch','Meal'],['🌙','Dinner','Meal'],['🍿','Snack','Meal'],['🍰','Dessert','Meal'],['🥬','Vegetarian','Diet'],['🌱','Vegan','Diet'],['🥛','Dairy-free','Diet'],['🌾','Gluten-free','Diet'],['🔥','Indian style','Cuisine'],['🍜','Asian style','Cuisine'],['🥗','Low calorie','Style'],['💪','Muscle friendly','Style']
  ],
  equipment: [
    ['🔥','Gas stove'],['⚡','Induction'],['📡','Microwave'],['♨️','Oven'],['🍟','Air fryer'],['🥘','Pressure cooker'],['🌀','Mixer / blender'],['🍳','Tawa'],['🍲','Kadhai'],['🥣','Saucepan'],['🍚','Rice cooker'],['🔪','Food processor'],['🥘','Handi'],['🍢','Grill pan'],['🫕','Dutch oven'],['🧇','Sandwich maker']
  ]
};

function App() {
  const [step, setStep] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [prefs, setPrefs] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [query, setQuery] = useState('');
  const [servings, setServings] = useState(2);
  const [recipes, setRecipes] = useState([]);
  const [intro, setIntro] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [timer, setTimer] = useState(null);

  useEffect(() => () => timer?.id && clearInterval(timer.id), [timer]);

  const items = step === 0 ? DATA.ingredients : step === 1 ? DATA.preferences : DATA.equipment;
  const selected = step === 0 ? ingredients : step === 1 ? prefs : equipment;
  const filtered = useMemo(() => items.filter(x => x[1].toLowerCase().includes(query.toLowerCase())), [items, query]);

  const toggle = (name) => {
    const setter = step === 0 ? setIngredients : step === 1 ? setPrefs : setEquipment;
    setter(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  const reset = () => {
    setStep(0); setIngredients([]); setPrefs([]); setEquipment([]); setQuery(''); setServings(2); setRecipes([]); setIntro(''); setError(''); setActive(null);
  };

  const generate = async () => {
    setStep(3); setLoading(true); setError(''); setRecipes([]);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: query, ingredients, preferences: prefs, equipment, servings })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
      setIntro(data.intro || 'Recipes personalized from your selections.');
      setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
    } catch (e) {
      setError(e.message || 'Could not connect to CookFlow AI.');
    } finally { setLoading(false); }
  };

  const startTimer = (seconds) => {
    if (timer?.id) clearInterval(timer.id);
    const end = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimer({ left, id });
      if (!left) clearInterval(id);
    }, 250);
    setTimer({ left: seconds, id });
  };

  const stepTitles = ['Ingredients','Preferences','Equipment','AI Recipes'];
  const titles = ['What ingredients do you have?', 'What kind of meal do you want?', 'What can you cook with?'];
  const subs = ['Select everything available. Search any ingredient.', 'Choose time, taste, diet, meal and style.', 'Select only the equipment you actually have.'];

  return <div className="app">
    <header className="topbar"><button className="brand" onClick={reset}><span>🍳</span> Cook<span>Flow</span></button><nav><button onClick={reset}>Home</button><button onClick={() => setStep(3)}>AI Recipes</button></nav></header>
    <section className="hero"><div className="pill">✨ AI-powered cooking assistant</div><h1>Cook with what you have.</h1><p>Tell CookFlow what is in your kitchen, what you want, and what equipment you have. Gemini builds the recipes and cooking roadmap.</p></section>
    <main>
      <div className="progress">{stepTitles.map((x,i)=><div key={x} className={`progressItem ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}><span>{i < step ? '✓' : i+1}</span>{x}</div>)}</div>

      {step < 3 && <section className="card wizard"><div className="sectionHead"><div><h2>{titles[step]}</h2><p>{subs[step]}</p></div><div className="serving"><label>Servings</label><select value={servings} onChange={e => setServings(Number(e.target.value))}>{[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n}</option>)}</select></div></div>
        <div className="searchRow"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={step === 0 ? 'Search ingredients...' : step === 1 ? 'Search preferences...' : 'Search equipment...'} /><small>{filtered.length} options</small></div>
        <div className="selectionInfo">Selected: <b>{selected.length}</b>{selected.length > 0 && <span> · {selected.slice(0,5).join(', ')}{selected.length > 5 ? '…' : ''}</span>}</div>
        <div className="optionGrid">{filtered.map(([emoji,name,cat],i) => <button key={name} className={`option ${selected.includes(name) ? 'chosen' : ''}`} onClick={() => toggle(name)}><img src={photo(name, hash(name)+i)} alt="" loading="lazy"/><div className="optionShade"/><div className="optionText"><span className="optionEmoji">{emoji}</span><strong>{name}</strong><small>{cat}</small></div>{selected.includes(name) && <span className="check">✓</span>}</button>)}</div>
        <div className="actions"><button className="btn secondary" disabled={step === 0} onClick={() => {setStep(step-1);setQuery('')}}>← Back</button><button className="btn primary" onClick={() => step === 2 ? generate() : (setStep(step+1), setQuery(''))}>{step === 2 ? '✨ Generate AI Recipes' : 'Continue →'}</button></div>
      </section>}

      {step === 3 && <section className="card resultsPanel"><div className="resultsTop"><div><div className="pill">✨ Personalized results</div><h2>Your AI recipes</h2><p>{loading ? 'Gemini is creating recipes from your selections…' : intro}</p></div><button className="btn secondary" onClick={() => setStep(2)}>← Change choices</button></div>
        <div className="summary"><b>Your search:</b> {query || 'No extra search'} <span>·</span> <b>{ingredients.length}</b> ingredients <span>·</span> <b>{prefs.length}</b> preferences <span>·</span> <b>{equipment.length}</b> equipment</div>
        {loading && <div className="loading"><div className="loader"/><h3>Creating your recipes…</h3><p>Matching ingredients, time, preferences and equipment.</p></div>}
        {error && <div className="error"><strong>Something went wrong</strong><p>{error}</p><button className="btn primary" onClick={generate}>Try again</button></div>}
        {!loading && !error && recipes.length > 0 && <div className="recipeGrid">{recipes.map((r,i) => <article className="recipeCard" key={`${r.name}-${i}`}><div className="recipeImg"><img src={photo(r.name + ' food', hash(r.name)+i)} alt={r.name} loading="lazy"/><span>{r.emoji || '🍳'}</span></div><div className="recipeContent"><div className="recipeMeta">⏱ {r.time || '?'} min · 👥 {r.servings || servings}</div><h3>{r.name}</h3><p>{r.description}</p><div className="tagRow">{(r.tags || []).slice(0,5).map(t => <span key={t}>{t}</span>)}</div><button className="btn primary full" onClick={() => setActive(r)}>View full roadmap →</button></div></article>)}</div>}
        {!loading && !error && recipes.length === 0 && <div className="empty"><div>🍽️</div><h3>No recipes yet</h3><p>Choose some ingredients and preferences, then generate again.</p></div>}
        <button className="btn secondary" onClick={reset}>＋ Start a new search</button>
      </section>}
    </main>
    <footer>CookFlow · Smart cooking, one step at a time.</footer>

    {active && <div className="modal" onMouseDown={() => setActive(null)}><div className="modalBox" onMouseDown={e => e.stopPropagation()}><button className="close" onClick={() => setActive(null)}>×</button><div className="modalIcon">{active.emoji || '🍳'}</div><h2>{active.name}</h2><p className="modalSub">{active.time || '?'} minutes · {active.servings || servings} servings</p><p>{active.description}</p><h3>Ingredients</h3><div className="ingredientList">{(active.ingredients || []).map((x,i)=><div key={i}><b>{x.name}</b><span>{x.quantity}</span></div>)}</div><h3>Equipment</h3><p>{(active.equipment || []).join(' · ') || 'Basic kitchen utensils'}</p><h3>Cooking roadmap</h3><div className="roadmap">{(active.steps || []).map((s,i)=><div className="road" key={i}><span>{i+1}</span><div><b>{s.instruction}</b><small>{s.heat && s.heat !== 'none' ? `🔥 ${s.heat}` : ''}{Number(s.timerSeconds) > 0 ? ` · ⏱ ${Math.ceil(s.timerSeconds/60)} min` : ''}</small>{Number(s.timerSeconds) > 0 && <button className="timerBtn" onClick={() => startTimer(Number(s.timerSeconds))}>Start timer</button>}</div></div>)}</div><h3>Substitutions</h3><ul>{(active.substitutions || []).map((x,i)=><li key={i}>{x}</li>)}</ul><h3>Tips</h3><ul>{(active.tips || []).map((x,i)=><li key={i}>{x}</li>)}</ul><button className="btn primary full" onClick={() => setActive(null)}>🍳 Start Cooking</button></div></div>}
    {timer && <div className="timerFloat">⏱ {Math.floor(timer.left/60)}:{String(timer.left%60).padStart(2,'0')} {timer.left === 0 ? '— Done!' : ''}<button onClick={() => { clearInterval(timer.id); setTimer(null); }}>×</button></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
