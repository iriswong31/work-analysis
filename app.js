App({
  onLaunch() {
    // 小程序启动时的初始化逻辑
    console.log('爱心商户小程序启动');
  },
  globalData: {
    userInfo: null,
    merchantInfo: null,
    // 审核状态: none / pending / approved / rejected
    auditStatus: 'none',
    // API基础地址（后端对接时替换）
    baseUrl: 'https://api.example.com'
  }
});
