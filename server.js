// server.js — Simple Express backend
// allow both roles to post for testing; in spec, middle students ask, high answer
const q = { id: nanoid(), title, content, tags: tags||[], school_id, author_id: user.id, created_at: Date.now() };
db.data.questions.push(q);
await db.write();
res.json(q);
});


app.post('/api/questions/:qid/answers', authMiddleware, async (req, res) => {
const { content } = req.body;
const qid = req.params.qid;
await db.read();
const question = db.data.questions.find(q => q.id === qid);
if(!question) return res.status(404).json({ error: 'Question not found' });
const user = db.data.users.find(u => u.id === req.user.id);
if(!user) return res.status(404).json({ error: 'User not found' });
// In spec, only verified high school students can answer. Enforce here:
if(user.role !== 'high' || !user.verified) return res.status(403).json({ error: 'Only verified high school students can answer' });
const ans = { id: nanoid(), question_id: qid, content, author_id: user.id, created_at: Date.now() };
db.data.answers.push(ans);
await db.write();
res.json(ans);
});


app.get('/api/questions/:qid/answers', async (req, res) => {
const qid = req.params.qid;
await db.read();
const list = db.data.answers.filter(a => a.question_id === qid);
res.json(list);
});


// --- Gemini AI stub: question-improve, answer-draft, summarize ---
app.post('/api/ai/improve-question', authMiddleware, async (req, res) => {
const { text } = req.body;
// Simple local improvement: trim and ensure polite form. For production, call Gemini
// Example of calling Gemini (pseudo):
// const r = await fetch('https://api.gemini.example/v1/generate', { headers: { 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` }, body: JSON.stringify({ prompt: 'Improve: ' + text }) })
// const data = await r.json();


// Starter: return an improved version (very naive)
const improved = (text||'').trim();
const suggestion = improved.length > 0 ? `${improved}\n\n(질문을 더 명확히 하려면: 학교명/학년/궁금한점 구체화)` : '';
res.json({ improved: suggestion });
});


app.post('/api/ai/draft-answer', authMiddleware, async (req, res) => {
const { question } = req.body;
// For prod: call Gemini API with system prompt to draft an answer as a high-school student.
// Starter: return a short template
const draft = `안녕하세요! ${question.title || '질문'}에 대해 제가 아는 범위에서 알려드릴게요. 먼저 수업시간/내신 관련 정보는 학교마다 다릅니다. (여기에 구체적 경험 추가)`;
res.json({ draft });
});


app.post('/api/ai/summarize', authMiddleware, async (req, res) => {
const { text, max_chars } = req.body;
const max = max_chars || 150;
// naive summarization
const s = (text || '').replace(/\n+/g, ' ').slice(0, max);
res.json({ summary: s + (text.length > max ? '...' : '') });
});


// --- start server ---
app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});
