// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ---------------------
// 데이터 로드
// ---------------------
const schools = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'schools.json')));
const dbFile = path.join(__dirname, 'data', 'db.json');

// 초기 DB 구조
let db = { users: [], questions: [], answers: [], verifications: [] };
if (fs.existsSync(dbFile)) db = JSON.parse(fs.readFileSync(dbFile));

// ---------------------
// 유틸
// ---------------------
function saveDB() { fs.writeFileSync(dbFile, JSON.stringify(db, null, 2)); }
function generateToken(user) { return jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }); }
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = db.users.find(u => u.id === decoded.id);
    if (!req.user) return res.status(401).json({ error: 'Invalid user' });
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
}

// ---------------------
// 인증
// ---------------------
app.post('/api/auth/register', (req, res) => {
  const { email, password, nickname, user_type } = req.body;
  if (db.users.find(u => u.email === email)) return res.json({ error: '이미 존재하는 이메일' });
  const id = Date.now().toString();
  const user = { id, email, password, nickname, user_type, verified: false };
  db.users.push(user);
  saveDB();
  res.json({ token: generateToken(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.json({ error: '이메일 또는 비밀번호 오류' });
  res.json({ token: generateToken(user) });
});

// 학생증 인증 요청
app.post('/api/auth/request-verification', authMiddleware, (req, res) => {
  const { school_id } = req.body;
  if (!school_id) return res.json({ error: '학교 선택 필요' });
  db.verifications.push({ user_id: req.user.id, school_id, status: 'pending', requested_at: Date.now() });
  saveDB();
  req.user.verified = false;
  saveDB();
  res.json({ ok: true });
});

// ---------------------
// 학교 검색
// ---------------------
app.get('/api/schools', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let list = schools;
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q));
  res.json(list);
});

// ---------------------
// 질문 / 답변 CRUD
// ---------------------
app.get('/api/questions', authMiddleware, (req, res) => {
  const school_id = req.query.school_id;
  let list = db.questions;
  if (school_id) list = list.filter(q => q.school_id === school_id);
  res.json(list);
});

app.post('/api/questions', authMiddleware, (req, res) => {
  const { title, content, tags, school_id } = req.body;
  if (!school_id || !title || !content) return res.json({ error: '제목/내용/학교 필요' });
  const id = Date.now().toString();
  const question = { id, title, content, tags: tags||[], school_id, user_id: req.user.id, created_at: Date.now() };
  db.questions.push(question);
  saveDB();
  res.json({ id });
});

app.get('/api/questions/:id/answers', authMiddleware, (req, res) => {
  const qid = req.params.id;
  const ans = db.answers.filter(a => a.question_id === qid);
  res.json(ans);
});

app.post('/api/questions/:id/answers', authMiddleware, (req, res) => {
  const qid = req.params.id;
  const { content } = req.body;
  if (!content) return res.json({ error: '내용 필요' });
  const id = Date.now().toString();
  const answer = { id, question_id: qid, content, user_id: req.user.id, created_at: Date.now() };
  db.answers.push(answer);
  saveDB();
  res.json({ id });
});

// ---------------------
// AI 연동 (Gemini API 예시)
// ---------------------
app.post('/api/ai/improve-question', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ error: '텍스트 필요' });

  // TODO: Gemini API 실제 호출 코드
  // 여기서는 샘플로 text를 대문자로 반환
  const improved = text.toUpperCase();
  res.json({ improved });
});

// ---------------------
// 서버 시작
// ---------------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
