const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const OPENAI_KEY = process.env.OPENAI_KEY || '';
const PORT = process.env.PORT || 3000;

// Simple JSON "DB" file
const DB_FILE = './db.json';
function loadDB(){
  if(!fs.existsSync(DB_FILE)){
    const init = { users:[], transactions:[], habits:[], reflections:[], plans:[], messages:[] };
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

// Helper: call OpenAI (chat completions)
async function callOpenAI(messages, max_tokens=300){
  if(!OPENAI_KEY) return { error: 'OPENAI_KEY not set in environment' };
  try{
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens
      })
    });
    const data = await resp.json();
    return data;
  } catch(e){
    console.error('openai error', e);
    return { error: String(e) };
  }
}

// Public simple user (single-user flow for MVP)
const DEFAULT_USER = { id: 'user_1', name: 'You', currency: '₦', dietary_prefs: { vegetarian:false }, goals: { save_monthly: 50000 } };

// GET /api/dashboard
app.get('/api/dashboard', (req,res)=>{
  const db = loadDB();
  // compute simple finance summary
  const transactions = db.transactions.filter(t => t.user_id === DEFAULT_USER.id);
  const balance = transactions.reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount), 0);
  // today's plan (if any)
  const today = new Date().toISOString().slice(0,10);
  const planObj = db.plans.find(p => p.user_id===DEFAULT_USER.id && p.date===today);
  const habits = db.habits.filter(h => h.user_id === DEFAULT_USER.id);
  res.json({
    user: DEFAULT_USER,
    balance,
    plan: planObj ? planObj.plan : [],
    habits
  });
});

// POST /api/transactions
app.post('/api/transactions', (req,res)=>{
  const { amount, type, category, note } = req.body;
  const db = loadDB();
  const tx = { id: uuidv4(), user_id: DEFAULT_USER.id, amount: Number(amount||0), type: type||'expense', category: category||'general', note: note||'', date: new Date().toISOString() };
  db.transactions.push(tx);
  saveDB(db);
  res.json({ ok:true, tx });
});

// GET /api/transactions
app.get('/api/transactions', (req,res)=>{
  const db = loadDB();
  const transactions = db.transactions.filter(t => t.user_id === DEFAULT_USER.id);
  res.json({ transactions });
});

// POST /api/habits
app.post('/api/habits', (req,res)=>{
  const { title, frequency, reminder_time } = req.body;
  const db = loadDB();
  const h = { id: uuidv4(), user_id: DEFAULT_USER.id, title, frequency: frequency||'daily', reminder_time: reminder_time||null, streak:0 };
  db.habits.push(h);
  saveDB(db);
  res.json({ ok:true, habit:h });
});

// PATCH /api/habits/:id/toggle -> mark complete (simplified)
app.patch('/api/habits/:id/toggle', (req,res)=>{
  const id = req.params.id;
  const db = loadDB();
  const h = db.habits.find(x=>x.id===id && x.user_id===DEFAULT_USER.id);
  if(!h) return res.status(404).json({ error:'not found' });
  h.streak = (h.streak||0) + 1;
  saveDB(db);
  res.json({ ok:true, habit:h });
});

// POST /api/reflections
app.post('/api/reflections', (req,res)=>{
  const { content, mood_score } = req.body;
  const db = loadDB();
  const r = { id: uuidv4(), user_id: DEFAULT_USER.id, date: new Date().toISOString(), content: content||'', mood_score: mood_score||null };
  db.reflections.push(r);
  saveDB(db);
  res.json({ ok:true, reflection:r });
});

// GET /api/reflections
app.get('/api/reflections', (req,res)=>{
  const db = loadDB();
  const reflections = db.reflections.filter(r => r.user_id === DEFAULT_USER.id);
  res.json({ reflections });
});

// POST /api/plans/generate -> uses OpenAI to generate a plan
app.post('/api/plans/generate', async (req,res)=>{
  const { date } = req.body;
  const db = loadDB();
  const transactions = db.transactions.filter(t => t.user_id === DEFAULT_USER.id).slice(-10);
  const habits = db.habits.filter(h => h.user_id === DEFAULT_USER.id);
  const profile = DEFAULT_USER;
  const prompt = [
    { role:'system', content: 'You are a helpful life assistant that produces concise daily plans in JSON.'},
    { role:'user', content: `Profile: ${JSON.stringify(profile)}\nHabits: ${JSON.stringify(habits)}\nRecent transactions: ${JSON.stringify(transactions)}\nProduce a JSON response with keys: plan (array of {time,task}), meals (array of strings), finance_tip (string). Keep it short.` }
  ];
  const ai = await callOpenAI(prompt, 300);
  if(ai.error) return res.status(500).json(ai);
  const reply = ai.choices && ai.choices[0] && ai.choices[0].message && ai.choices[0].message.content;
  // attempt to parse JSON from reply
  let parsed = null;
  try{
    parsed = JSON.parse(reply);
  }catch(e){
    // fallback: create a simple default plan
    parsed = {
      plan: [
        { time:'07:00', task:'Wake up, hydrate, 10 min stretch' },
        { time:'08:00', task:'Breakfast — oats or eggs' },
        { time:'09:00', task:'Deep work block (priority task)' },
        { time:'13:00', task:'Lunch and short walk' },
        { time:'17:00', task:'Exercise or gym' },
        { time:'20:00', task:'Plan tomorrow and reflect' }
      ],
      meals: ['Breakfast: Oats', 'Lunch: Rice + veg', 'Dinner: Light protein + salad'],
      finance_tip: 'Track small daily expenses to reach savings target.'
    };
  }
  const planEntry = { id: uuidv4(), user_id: DEFAULT_USER.id, date: date || new Date().toISOString().slice(0,10), plan: parsed.plan };
  db.plans = db.plans.filter(p=>!(p.user_id===DEFAULT_USER.id && p.date===planEntry.date));
  db.plans.push(planEntry);
  saveDB(db);
  res.json({ ok:true, parsed, planEntry });
});

// POST /api/chat -> simple relay to OpenAI and store messages
app.post('/api/chat', async (req,res)=>{
  const { message } = req.body;
  const db = loadDB();
  db.messages.push({ id: uuidv4(), user_id: DEFAULT_USER.id, role:'user', content: message, created_at: new Date().toISOString() });
  saveDB(db);
  const prompt = [
    { role:'system', content: 'You are an AI mentor: firm, encouraging, and honest. Provide short actionable advice.' },
    { role:'user', content: message }
  ];
  const ai = await callOpenAI(prompt, 250);
  if(ai.error) return res.status(500).json(ai);
  const reply = ai.choices && ai.choices[0] && ai.choices[0].message && ai.choices[0].message.content || 'Sorry, no reply';
  db.messages.push({ id: uuidv4(), user_id: DEFAULT_USER.id, role:'assistant', content: reply, created_at: new Date().toISOString() });
  saveDB(db);
  res.json({ reply });
});

app.listen(PORT, ()=> console.log('Server running on port', PORT));