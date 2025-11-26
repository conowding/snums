// main.js
const apiRoot = '';
let token = null;
let selectedSchool = null;

// ----------------------------
// 유틸 함수
// ----------------------------
const apiFetch = async (url, options = {}) => {
  options.headers = options.headers || {};
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  options.headers['Content-Type'] = 'application/json';
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, options);
  return await res.json();
};

const formatDate = ts => new Date(ts).toLocaleString();

// ----------------------------
// 인증 UI
// ----------------------------
function showAuth() {
  const el = document.getElementById('auth');
  el.innerHTML = '';
  if (!token) {
    el.innerHTML = `
      <div class="flex flex-wrap gap-2">
        <input id="email" placeholder="email" class="p-2 border rounded"/>
        <input id="pw" type="password" placeholder="password" class="p-2 border rounded"/>
        <input id="nick" placeholder="nickname" class="p-2 border rounded"/>
        <select id="uType" class="p-2 border rounded">
          <option value="middle">중학생</option>
          <option value="high">고등학생</option>
        </select>
        <button id="regBtn" class="px-3 py-2 bg-blue-600 text-white rounded">가입</button>
        <button id="loginBtn" class="px-3 py-2 bg-gray-600 text-white rounded">로그인</button>
      </div>
    `;
    document.getElementById('regBtn').onclick = register;
    document.getElementById('loginBtn').onclick = login;
  } else {
    el.innerHTML = `
      <div class="flex items-center gap-2">
        로그인됨
        <button id="logoutBtn" class="px-3 py-1 bg-red-600 text-white rounded">로그아웃</button>
      </div>`;
    document.getElementById('logoutBtn').onclick = () => {
      token = null;
      selectedSchool = null;
      document.getElementById('schoolList').innerHTML = '';
      document.getElementById('questionsList').innerHTML = '';
      document.getElementById('questionForm').classList.add('hidden');
      showAuth();
    };
  }
}

// ----------------------------
// 인증 액션
// ----------------------------
async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('pw').value;
  const nickname = document.getElementById('nick').value;
  const user_type = document.getElementById('uType').value;
  const res = await apiFetch('/api/auth/register', { method: 'POST', body: { email, password, nickname, user_type } });
  if (res.token) { token = res.token; showAuth(); }
  else alert(res.error || '등록 실패');
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('pw').value;
  const res = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
  if (res.token) { token = res.token; showAuth(); }
  else alert(res.error || '로그인 실패');
}

// ----------------------------
// 학교 검색/선택
// ----------------------------
const schoolSearch = document.getElementById('schoolSearch');
schoolSearch.addEventListener('input', async (e) => {
  const q = e.target.value.trim();
  const el = document.getElementById('schoolList');
  if (!q) { el.innerHTML = ''; return; }
  const list = await apiFetch('/api/schools?q=' + encodeURIComponent(q));
  el.innerHTML = list.slice(0, 20).map(s => `
    <div class="p-2 hover:bg-gray-100 cursor-pointer" data-id="${s.school_id}">${s.name} — ${s.type}</div>
  `).join('');
  el.querySelectorAll('div').forEach(d => d.onclick = () => selectSchool(d.dataset.id, list.find(x => x.school_id === d.dataset.id)));
});

function selectSchool(id, school) {
  selectedSchool = school;
  document.getElementById('schoolList').innerHTML = `
    <div class="p-2">선택: <strong>${school.name}</strong>
    <button id="clearS" class="ml-2 px-2 py-1 bg-red-200 rounded">취소</button></div>
  `;
  document.getElementById('clearS').onclick = () => {
    selectedSchool = null;
    document.getElementById('schoolList').innerHTML = '';
    document.getElementById('questionForm').classList.add('hidden');
  };
  document.getElementById('questionForm').classList.remove('hidden');
  loadQuestionsForSchool();
}

// ----------------------------
// 질문 CRUD
// ----------------------------
async function loadQuestionsForSchool() {
  const listEl = document.getElementById('questionsList');
  listEl.innerHTML = '불러오는 중...';
  const qs = await apiFetch('/api/questions?school_id=' + encodeURIComponent(selectedSchool.school_id));
  if (!qs.length) listEl.innerHTML = '<div class="p-2 text-gray-500">질문이 없습니다.</div>';
  else listEl.innerHTML = qs.map(q => `
    <div class="p-3 bg-white rounded shadow">
      <div class="font-semibold">${q.title}</div>
      <div class="text-sm text-gray-600">${formatDate(q.created_at)}</div>
      <div class="mt-2">${q.content}</div>
      <div class="mt-2">
        <button class="px-2 py-1 bg-indigo-600 text-white rounded" onclick="openAnswers('${q.id}')">답변 보기</button>
      </div>
    </div>
  `).join('');
}

window.openAnswers = async (qid) => {
  const ans = await apiFetch('/api/questions/' + qid + '/answers');
  if (!ans.length) alert('답변 없음');
  else alert(ans.map(a => `${formatDate(a.created_at)}: ${a.content}`).join('\n\n'));
}

// ----------------------------
// 질문 등록 & AI 개선
// ----------------------------
document.getElementById('postQBtn').onclick = async () => {
  if (!token) return alert('로그인 필요');
  if (!selectedSchool) return alert('학교 선택 필요');
  const title = document.getElementById('qTitle').value.trim();
  const content = document.getElementById('qContent').value.trim();
  if (!title || !content) return alert('제목과 내용을 입력하세요');
  const res = await apiFetch('/api/questions', { method: 'POST', body: { title, content, tags: [], school_id: selectedSchool.school_id } });
  if (res.id) {
    document.getElementById('qTitle').value = '';
    document.getElementById('qContent').value = '';
    loadQuestionsForSchool();
  } else alert(res.error || '질문 등록 실패');
};

document.getElementById('improveBtn').onclick = async () => {
  if (!token) return alert('로그인 필요');
  const content = document.getElementById('qContent').value;
  if (!content) return;
  const res = await apiFetch('/api/ai/improve-question', { method: 'POST', body: { text: content } });
  if (res.improved) document.getElementById('qContent').value = res.improved;
};

// ----------------------------
// 초기 화면
// ----------------------------
showAuth();
