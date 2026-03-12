const app = getApp();

Page({
  data: {
    showIntro: true
  },

  onLoad() {
    // 检查是否已登录，如果已登录则跳转到状态页
    const merchantInfo = app.globalData.merchantInfo;
    if (merchantInfo) {
      wx.redirectTo({
        url: '/pages/status/status'
      });
    }
  },

  // 关闭介绍弹窗
  closeIntro() {
    this.setData({ showIntro: false });
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }
});
