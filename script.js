// 页面跳转
function goToPage(pageId) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // 显示目标页面
  document.getElementById(pageId).classList.add('active');

  // 滚动到顶部
  window.scrollTo(0, 0);
}

// Tab切换
function switchTab(el, tab) {
  // 更新Tab样式
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.remove('active');
  });
  el.classList.add('active');

  // 更新表单显示
  if (tab === 'invite') {
    document.getElementById('invite-form').style.display = 'block';
  } else {
    document.getElementById('invite-form').style.display = 'none';
  }
}

// 验证码倒计时
let countdown = 0;
let timer = null;

function sendCode() {
  if (countdown > 0) return;

  const btn = document.querySelector('.code-btn');
  countdown = 60;
  btn.textContent = countdown + 's';
  btn.style.background = '#ccc';

  timer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(timer);
      btn.textContent = '获取验证码';
      btn.style.background = 'linear-gradient(135deg, #FF8A80, #E74C3C)';
    } else {
      btn.textContent = countdown + 's';
    }
  }, 1000);
}

// 勾选框切换
function toggleCheck(el) {
  const checkbox = el.querySelector('.checkbox');
  if (checkbox.classList.contains('checked')) {
    checkbox.classList.remove('checked');
    checkbox.textContent = '';
  } else {
    checkbox.classList.add('checked');
    checkbox.textContent = '✓';
  }
}

// 模拟登录
function simulateLogin() {
  const btn = document.querySelector('#page-login .btn-primary');
  btn.textContent = '登录中...';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = '验证并登录';
    btn.disabled = false;
    goToPage('page-apply');
  }, 1500);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('爱心商户预览页面已加载');

  // 登录按钮绑定
  const loginBtn = document.querySelector('#page-login .btn-primary');
  if (loginBtn) {
    loginBtn.onclick = simulateLogin;
  }
});
