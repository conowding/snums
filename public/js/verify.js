// verify.js
let token = localStorage.getItem('token');
let selectedSchool = null;

const schoolInput = document.getElementById('schoolSearch');
const schoolList = document.getElementById('schoolList');

schoolInput.addEventListener('input', async e => {
  const q = e.target.value.trim();
  if (!q) { schoolList.innerHTML = ''; return; }
  const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`);
  const schools = await res.json();
  schoolList.innerHTML = schools.slice(0, 20).map(s => `
    <div class="p-2 hover:bg-gray-100 cursor-pointer" data-id="${s.school_id}">${s.name} — ${s.type}</div>
  `).join('');
  schoolList.querySelectorAll('div').forEach(d => d.onclick = () => selectSchool(d.dataset.id, schools.find(x => x.school_id === d.dataset.id)));
});

function selectSchool(id, school) {
  selectedSchool = school;
  schoolList.innerHTML = `<div class="p-2">선택: <strong>${school.name}</strong></div>`;
}

document.getElementById('verifyBtn').onclick = async () => {
  if (!token) return alert('로그인 필요');
  if (!selectedSchool) return alert('학교 선택 필요');
  const res = await fetch('/api/auth/request-verification', {
    method: 'POST',
    headers: {'Content-Type': 'application/json','Authorization': 'Bearer '+token},
    body: JSON.stringify({ school_id: selectedSchool.school_id })
  });
  const data = await res.json();
  if (data.ok) { alert('학생증 인증 신청 완료'); location.href = '/index.html'; }
  else alert(data.error || '인증 실패');
};
