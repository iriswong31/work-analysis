// ========== 角色与功能注册中心 ==========
// 新增角色：在 ROLES 中添加配置
// 新增功能：创建 features/xxx.js 文件并调用 registerFeature()

const ROLES = {
  beneficiary: {
    id: 'beneficiary',
    name: '受助人',
    icon: '👴',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    description: '帮你查看关爱活动、申领帮帮卡',
    enabled: false,
    features: []
  },
  merchant: {
    id: 'merchant',
    name: '爱心商户',
    icon: '🏪',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    description: '帮你管理店铺、核销关爱卡',
    enabled: false,
    features: []
  },
  volunteer: {
    id: 'volunteer',
    name: '志愿者',
    icon: '🤝',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    description: '帮你报名活动、记录服务',
    enabled: false,
    features: []
  },
  institution: {
    id: 'institution',
    name: '公益机构',
    icon: '🏛️',
    color: '#E84142',
    bgColor: '#FFE8E8',
    description: '帮你办理商家入驻、管理活动、查看数据',
    enabled: true,
    features: ['merchant-onboard']
  }
};

// 功能模块注册表
const FEATURES = {};

function registerFeature(feature) {
  FEATURES[feature.id] = feature;
}

function getFeaturesForRole(roleId) {
  const role = ROLES[roleId];
  if (!role) return [];
  return role.features.map(fId => FEATURES[fId]).filter(Boolean);
}

function getRole(roleId) {
  return ROLES[roleId] || null;
}

function getAllRoles() {
  return Object.values(ROLES);
}
