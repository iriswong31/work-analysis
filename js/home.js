// ========== 首页 & 智能小助手 控制器 ==========
const HomeController = {
  init() {
    this.renderRoleCards();
    this.bindEvents();
  },

  renderRoleCards() {
    const grid = document.getElementById('roleGrid');
    if (!grid) return;

    const roles = getAllRoles();
    grid.innerHTML = roles.map(role => `
      <div class="asst-role-card-new ${role.enabled ? 'asst-role-enabled' : 'asst-role-disabled'}" data-role="${role.id}">
        <div class="asst-role-icon-wrap-new" style="background: ${role.bgColor}">
          <span class="asst-role-icon-new">${role.icon}</span>
        </div>
        <div class="asst-role-name-new">${role.name}</div>
        <div class="asst-role-desc-new">${role.description}</div>
        ${role.enabled ? '<div class="asst-role-badge-new">可体验</div>' : '<div class="asst-role-badge-new asst-badge-soon-new">即将开放</div>'}
      </div>
    `).join('');
  },

  bindEvents() {
    // 首页：点击太阳花进入智能助手
    document.getElementById('homeEnterBtn')?.addEventListener('click', () => {
      Router.navigateTo('assistant', {});
    });

    // 智能小助手页：返回按钮
    document.getElementById('asstBackBtn')?.addEventListener('click', () => {
      Router.goBack();
    });

    // 角色卡片点击
    document.getElementById('roleGrid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.asst-role-card-new');
      if (!card) return;
      const roleId = card.dataset.role;
      const role = getRole(roleId);
      if (!role) return;

      if (role.enabled) {
        Router.navigateTo('chat', { roleId });
      } else {
        Router.navigateTo('coming-soon', { role });
      }
    });
  }
};
