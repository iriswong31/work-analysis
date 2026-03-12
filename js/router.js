// ========== 轻量级视图路由管理器 ==========
const Router = {
  stack: [],        // 导航栈
  currentView: null,
  views: {},        // 注册的视图 DOM 元素

  init() {
    // 注册所有视图容器
    document.querySelectorAll('[data-view]').forEach(el => {
      this.views[el.dataset.view] = el;
      el.classList.add('view-hidden');
    });
    // 默认显示首页
    this.navigateTo('home', {}, false);
  },

  navigateTo(viewName, params = {}, animate = true) {
    const targetView = this.views[viewName];
    if (!targetView) return;

    const prevView = this.currentView ? this.views[this.currentView] : null;

    // 推入导航栈
    if (this.currentView && this.currentView !== viewName) {
      this.stack.push({ view: this.currentView, params });
    }

    // 动画切换
    if (animate && prevView) {
      prevView.classList.add('view-slide-out-left');
      targetView.classList.remove('view-hidden');
      targetView.classList.add('view-slide-in-right');

      setTimeout(() => {
        prevView.classList.add('view-hidden');
        prevView.classList.remove('view-slide-out-left');
        targetView.classList.remove('view-slide-in-right');
      }, 350);
    } else {
      if (prevView) prevView.classList.add('view-hidden');
      targetView.classList.remove('view-hidden');
    }

    this.currentView = viewName;

    // 触发视图进入事件
    const event = new CustomEvent('viewEnter', { detail: { view: viewName, params } });
    document.dispatchEvent(event);
  },

  goBack(animate = true) {
    if (this.stack.length === 0) return;
    const prev = this.stack.pop();
    const prevView = this.views[prev.view];
    const currentViewEl = this.views[this.currentView];

    if (!prevView || !currentViewEl) return;

    if (animate) {
      currentViewEl.classList.add('view-slide-out-right');
      prevView.classList.remove('view-hidden');
      prevView.classList.add('view-slide-in-left');

      setTimeout(() => {
        currentViewEl.classList.add('view-hidden');
        currentViewEl.classList.remove('view-slide-out-right');
        prevView.classList.remove('view-slide-in-left');
      }, 350);
    } else {
      currentViewEl.classList.add('view-hidden');
      prevView.classList.remove('view-hidden');
    }

    this.currentView = prev.view;

    const event = new CustomEvent('viewEnter', { detail: { view: prev.view, params: prev.params } });
    document.dispatchEvent(event);
  }
};
