const app = getApp();

Page({
  data: {
    status: 'pending', // pending / approved / rejected
    submitTime: '',
    rejectReason: ''
  },

  onLoad() {
    // 获取审核状态
    const status = app.globalData.auditStatus || 'pending';

    // 生成提交时间
    const now = new Date();
    const submitTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.setData({
      status: status,
      submitTime: submitTime,
      rejectReason: '营业执照照片不清晰，请重新上传清晰版本。'
    });

    // TODO: 从后端获取真实审核状态
    // wx.request({
    //   url: app.globalData.baseUrl + '/api/merchant/status',
    //   method: 'GET',
    //   success: (res) => {
    //     this.setData({
    //       status: res.data.status,
    //       submitTime: res.data.submitTime,
    //       rejectReason: res.data.rejectReason
    //     });
    //   }
    // });
  },

  onShow() {
    // 每次显示时刷新状态
  },

  // 下拉刷新
  onPullDownRefresh() {
    // TODO: 刷新审核状态
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: '已刷新', icon: 'success' });
    }, 1000);
  },

  // 跳转到成功页
  goToSuccess() {
    wx.redirectTo({
      url: '/pages/success/success'
    });
  },

  // 重新申请
  reApply() {
    app.globalData.auditStatus = 'none';
    wx.redirectTo({
      url: '/pages/apply/apply'
    });
  },

  // 返回首页
  goBack() {
    wx.redirectTo({
      url: '/pages/index/index'
    });
  }
});
