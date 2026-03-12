const app = getApp();

Page({
  data: {
    activeTab: 'invite', // invite / phone
    inviteCode: '',
    phone: '',
    smsCode: '',
    codeText: '获取验证码',
    codeBtnDisabled: false,
    agreed: false,
    loading: false,
    countdown: 0
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 输入邀请码
  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail.value });
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 输入验证码
  onSmsCodeInput(e) {
    this.setData({ smsCode: e.detail.value });
  },

  // 发送验证码
  sendSmsCode() {
    if (this.data.codeBtnDisabled) return;

    const phone = this.data.phone;
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    // TODO: 调用后端发送验证码接口
    // wx.request({
    //   url: app.globalData.baseUrl + '/api/sms/send',
    //   method: 'POST',
    //   data: { phone },
    //   success: (res) => { ... }
    // });

    // 模拟发送成功
    wx.showToast({ title: '验证码已发送', icon: 'success' });

    // 倒计时
    let countdown = 60;
    this.setData({
      codeBtnDisabled: true,
      codeText: `${countdown}s`
    });

    const timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timer);
        this.setData({
          codeBtnDisabled: false,
          codeText: '获取验证码'
        });
      } else {
        this.setData({ codeText: `${countdown}s` });
      }
    }, 1000);
  },

  // 切换协议勾选
  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed });
  },

  // 查看协议
  showAgreement(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({
      title: type === 'service' ? '服务协议' : '隐私政策',
      icon: 'none'
    });
    // TODO: 跳转到协议详情页
  },

  // 登录
  handleLogin() {
    const { activeTab, inviteCode, phone, smsCode, agreed } = this.data;

    // 验证
    if (!agreed) {
      wx.showToast({ title: '请先同意服务协议', icon: 'none' });
      return;
    }

    if (activeTab === 'invite' && !inviteCode) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }

    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!smsCode || smsCode.length < 4) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    // TODO: 调用后端登录接口
    // wx.request({
    //   url: app.globalData.baseUrl + '/api/merchant/login',
    //   method: 'POST',
    //   data: { inviteCode, phone, smsCode },
    //   success: (res) => { ... }
    // });

    // 模拟登录成功
    setTimeout(() => {
      this.setData({ loading: false });

      // 保存登录状态
      app.globalData.userInfo = {
        phone: phone,
        inviteCode: inviteCode
      };

      // 模拟检查商户状态
      const mockStatus = 'none'; // none / pending / approved / rejected

      if (mockStatus === 'none') {
        // 未申请过，跳转到申请页
        wx.redirectTo({
          url: '/pages/apply/apply'
        });
      } else {
        // 已申请过，跳转到状态页
        app.globalData.auditStatus = mockStatus;
        wx.redirectTo({
          url: '/pages/status/status'
        });
      }
    }, 1500);
  }
});
