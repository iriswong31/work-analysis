const app = getApp();

Page({
  data: {
    currentStep: 1,
    submitting: false,
    categoryList: ['餐饮美食', '生活超市', '服装鞋帽', '家居家电', '教育培训', '医疗健康', '美容美发', '维修服务', '其他'],
    form: {
      merchantName: '',
      category: '',
      address: '',
      addressDetail: '',
      contactPhone: '',
      legalName: '',
      legalIdCard: '',
      legalPhone: '',
      businessLicense: '',
      idCardFront: '',
      idCardBack: '',
      storePhoto: '',
      promiseSigned: false,
      endorseFile: ''
    },
    maskIdCard: '',
    maskPhone: ''
  },

  onLoad() {
    // 如果有保存的草稿，恢复表单
    const draft = wx.getStorageSync('applyDraft');
    if (draft) {
      this.setData({ form: draft });
    }
  },

  // 通用输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
    this.saveDraft();
  },

  // 选择经营类别
  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({
      'form.category': this.data.categoryList[index]
    });
    this.saveDraft();
  },

  // 选择位置
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.address': res.address || res.name
        });
        this.saveDraft();
      },
      fail: () => {
        // 模拟选择地址（开发调试用）
        wx.showModal({
          title: '提示',
          content: '真机调试时可选择地址，模拟器中请手动输入',
          showCancel: false
        });
      }
    });
  },

  // 选择图片
  chooseImage(e) {
    const field = e.currentTarget.dataset.field;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          [`form.${field}`]: tempFilePath
        });
        this.saveDraft();

        // TODO: 上传到服务器
        // this.uploadFile(tempFilePath, field);
      }
    });
  },

  // TODO: 上传文件到服务器
  // uploadFile(filePath, field) {
  //   wx.uploadFile({
  //     url: app.globalData.baseUrl + '/api/upload',
  //     filePath: filePath,
  //     name: 'file',
  //     success: (res) => {
  //       const data = JSON.parse(res.data);
  //       // 替换为服务器返回的URL
  //       this.setData({ [`form.${field}`]: data.url });
  //     }
  //   });
  // },

  // 切换承诺书签署
  togglePromise() {
    this.setData({
      'form.promiseSigned': !this.data.form.promiseSigned
    });
  },

  // 下一步
  nextStep() {
    const { currentStep, form } = this.data;

    if (currentStep === 1) {
      // 验证基础信息
      if (!form.merchantName) {
        wx.showToast({ title: '请输入商户名称', icon: 'none' });
        return;
      }
      if (!form.category) {
        wx.showToast({ title: '请选择经营类别', icon: 'none' });
        return;
      }
      if (!form.contactPhone) {
        wx.showToast({ title: '请输入联系电话', icon: 'none' });
        return;
      }
      if (!form.legalName) {
        wx.showToast({ title: '请输入法人姓名', icon: 'none' });
        return;
      }
      if (!form.legalIdCard) {
        wx.showToast({ title: '请输入法人身份证号', icon: 'none' });
        return;
      }
      if (!form.legalPhone) {
        wx.showToast({ title: '请输入法人手机号', icon: 'none' });
        return;
      }
    }

    if (currentStep === 2) {
      // 验证资质文件
      if (!form.businessLicense) {
        wx.showToast({ title: '请上传营业执照', icon: 'none' });
        return;
      }
      if (!form.idCardFront || !form.idCardBack) {
        wx.showToast({ title: '请上传身份证正反面', icon: 'none' });
        return;
      }
      if (!form.storePhoto) {
        wx.showToast({ title: '请上传门店照片', icon: 'none' });
        return;
      }
      if (!form.promiseSigned) {
        wx.showToast({ title: '请签署承诺书', icon: 'none' });
        return;
      }

      // 生成脱敏信息
      this.setData({
        maskIdCard: this.maskStr(form.legalIdCard, 4, 4),
        maskPhone: this.maskStr(form.legalPhone, 3, 4)
      });
    }

    this.setData({ currentStep: currentStep + 1 });
    wx.pageScrollTo({ scrollTop: 0 });
  },

  // 上一步
  prevStep() {
    const { currentStep } = this.data;
    if (currentStep > 1) {
      this.setData({ currentStep: currentStep - 1 });
      wx.pageScrollTo({ scrollTop: 0 });
    }
  },

  // 提交申请
  submitApply() {
    this.setData({ submitting: true });

    // TODO: 调用后端提交接口
    // wx.request({
    //   url: app.globalData.baseUrl + '/api/merchant/apply',
    //   method: 'POST',
    //   data: this.data.form,
    //   success: (res) => { ... }
    // });

    // 模拟提交成功
    setTimeout(() => {
      this.setData({ submitting: false });

      // 清除草稿
      wx.removeStorageSync('applyDraft');

      // 更新全局状态
      app.globalData.auditStatus = 'pending';
      app.globalData.merchantInfo = this.data.form;

      // 跳转到审核状态页
      wx.redirectTo({
        url: '/pages/status/status'
      });
    }, 2000);
  },

  // 保存草稿
  saveDraft() {
    wx.setStorageSync('applyDraft', this.data.form);
  },

  // 字符串脱敏
  maskStr(str, frontLen, endLen) {
    if (!str) return '';
    const len = str.length;
    const front = str.substring(0, frontLen);
    const end = str.substring(len - endLen);
    const maskLen = len - frontLen - endLen;
    return front + '*'.repeat(Math.max(0, maskLen)) + end;
  }
});
