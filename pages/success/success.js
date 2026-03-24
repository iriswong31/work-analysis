const app = getApp();

Page({
  data: {
    merchantInfo: {}
  },

  onLoad() {
    // 获取商户信息
    const merchantInfo = app.globalData.merchantInfo || {
      merchantName: '爱心小店',
      category: '餐饮美食',
      address: '广州市天河区',
      addressDetail: '体育西路XX号',
      contactPhone: '138****8888'
    };

    this.setData({ merchantInfo });

    // TODO: 从后端获取真实商户信息
    // wx.request({
    //   url: app.globalData.baseUrl + '/api/merchant/info',
    //   method: 'GET',
    //   success: (res) => {
    //     this.setData({ merchantInfo: res.data });
    //   }
    // });
  },

  // 返回首页
  goToHome() {
    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  // 进入商户中心（后续功能）
  goToStore() {
    wx.showToast({
      title: '商户中心开发中',
      icon: 'none'
    });
    // TODO: 后续对接管理后台
    // wx.navigateTo({
    //   url: '/pages/store/store'
    // });
  }
});
