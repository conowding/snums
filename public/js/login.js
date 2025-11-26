// login.js
const apiRoot = '';

document.getElementById('registerBtn').onclick = async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const nickname = document.getElementById('nickname').value.trim();
  const user_type = document.getElementById('userType').value;
  if (!email || !password || !nickname) return alert('모든 항목 입력 필요');

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ email, password, nickname, user_type })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    alert('가입 성공! 질문 화면으로 이동합니다.');
    location.href = '/index.html';
  } else alert(data.error || '가입 실패');
};

document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!email || !password) return alert('Email과 Password 입력 필요');

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    alert('로그인 성공! 질문 화면으로 이동합니다.');
    location.href = '/index.html';
  } else alert(data.error || '로그인 실패');
};
