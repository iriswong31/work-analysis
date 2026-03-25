/**
 * AIGP 物理实验室 — 电路仿真引擎
 * 支持纯串并联电路的拓扑分析和求解
 */

// === 电路元件 ===

export class Component {
  constructor(config) {
    this.id = config.id;
    this.type = config.type; // battery, resistor, bulb, switch, ammeter, voltmeter, rheostat, wire
    this.label = config.label || '';
    
    // 位置（由 renderer 管理，engine 不关心）
    this.x = config.x || 0;
    this.y = config.y || 0;
    
    // 电学属性
    this.voltage = config.voltage || 0;       // 电源电压 / 元件电压降
    this.resistance = config.resistance || 0; // 电阻值
    this.current = 0;                          // 流过的电流
    this.power = 0;                            // 功率
    
    // 特殊属性
    this.isOn = config.isOn !== undefined ? config.isOn : true;  // 开关状态
    this.maxResistance = config.maxResistance || 0;               // 变阻器最大阻值
    this.brightness = 0;                                          // 灯泡亮度 0-1
    this.ratedPower = config.ratedPower || 0;                     // 额定功率
    
    // 连接（terminal ids）
    this.terminals = config.terminals || ['a', 'b'];
  }
  
  getEffectiveResistance() {
    switch (this.type) {
      case 'battery': return 0; // 理想电源内阻为0
      case 'switch': return this.isOn ? 0 : Infinity;
      case 'wire': return 0;
      case 'ammeter': return 0; // 理想电流表内阻为0
      case 'voltmeter': return Infinity; // 理想电压表内阻无穷大
      case 'rheostat': return this.resistance; // 当前设定值
      default: return this.resistance;
    }
  }
  
  toggle() {
    if (this.type === 'switch') {
      this.isOn = !this.isOn;
      return true;
    }
    return false;
  }
  
  setRheostat(value) {
    if (this.type === 'rheostat') {
      this.resistance = Math.max(0, Math.min(this.maxResistance, value));
      return true;
    }
    return false;
  }
}

// === 电路 ===

export class Circuit {
  constructor() {
    this.components = new Map();
    this.connections = []; // [{from: {id, terminal}, to: {id, terminal}}]
    this.solved = false;
    this.hasError = false;
    this.errorType = null; // 'short-circuit', 'open-circuit'
  }
  
  addComponent(config) {
    const comp = new Component(config);
    this.components.set(comp.id, comp);
    this.solved = false;
    return comp;
  }
  
  getComponent(id) {
    return this.components.get(id);
  }
  
  connect(fromId, fromTerminal, toId, toTerminal) {
    this.connections.push({
      from: { id: fromId, terminal: fromTerminal },
      to: { id: toId, terminal: toTerminal }
    });
    this.solved = false;
  }
  
  clear() {
    this.components.clear();
    this.connections = [];
    this.solved = false;
    this.hasError = false;
    this.errorType = null;
  }
  
  // 构建节点图
  _buildNodeGraph() {
    const nodes = new Map(); // nodeId -> Set of {componentId, terminal}
    let nextNodeId = 0;
    
    // 找到每个端子属于哪个节点
    const terminalToNode = new Map(); // "compId:terminal" -> nodeId
    
    for (const conn of this.connections) {
      const keyFrom = `${conn.from.id}:${conn.from.terminal}`;
      const keyTo = `${conn.to.id}:${conn.to.terminal}`;
      
      const nodeFrom = terminalToNode.get(keyFrom);
      const nodeTo = terminalToNode.get(keyTo);
      
      if (nodeFrom !== undefined && nodeTo !== undefined) {
        // 合并两个节点
        if (nodeFrom !== nodeTo) {
          const mergeInto = Math.min(nodeFrom, nodeTo);
          const mergeFrom = Math.max(nodeFrom, nodeTo);
          for (const [key, val] of terminalToNode) {
            if (val === mergeFrom) terminalToNode.set(key, mergeInto);
          }
        }
      } else if (nodeFrom !== undefined) {
        terminalToNode.set(keyTo, nodeFrom);
      } else if (nodeTo !== undefined) {
        terminalToNode.set(keyFrom, nodeTo);
      } else {
        const nodeId = nextNodeId++;
        terminalToNode.set(keyFrom, nodeId);
        terminalToNode.set(keyTo, nodeId);
      }
    }
    
    // 为没有连接的端子创建独立节点
    for (const [id, comp] of this.components) {
      for (const terminal of comp.terminals) {
        const key = `${id}:${terminal}`;
        if (!terminalToNode.has(key)) {
          terminalToNode.set(key, nextNodeId++);
        }
      }
    }
    
    return terminalToNode;
  }
  
  // 求解电路
  solve() {
    this.hasError = false;
    this.errorType = null;
    
    // 重置所有元件
    for (const [, comp] of this.components) {
      comp.current = 0;
      comp.power = 0;
      comp.brightness = 0;
      if (comp.type !== 'battery') comp.voltage = 0;
    }
    
    // 找到电源
    let battery = null;
    for (const [, comp] of this.components) {
      if (comp.type === 'battery') {
        battery = comp;
        break;
      }
    }
    if (!battery) {
      this.solved = true;
      return;
    }
    
    // 检查开关状态 — 如果有开关断开则断路
    for (const [, comp] of this.components) {
      if (comp.type === 'switch' && !comp.isOn) {
        this.solved = true;
        // 断路 — 所有电流为0
        return;
      }
    }
    
    // 计算回路总等效电阻
    const loadComponents = [];
    for (const [, comp] of this.components) {
      if (comp.type !== 'battery' && comp.type !== 'wire' && 
          comp.type !== 'switch' && comp.type !== 'ammeter' && comp.type !== 'voltmeter') {
        loadComponents.push(comp);
      }
    }
    
    if (loadComponents.length === 0) {
      // 短路！
      this.hasError = true;
      this.errorType = 'short-circuit';
      this.solved = true;
      return;
    }
    
    // 分析拓扑结构
    const topology = this._analyzeTopology(loadComponents);
    const totalR = topology.equivalentResistance;
    
    if (totalR <= 0 || !isFinite(totalR)) {
      if (totalR <= 0) {
        this.hasError = true;
        this.errorType = 'short-circuit';
      }
      this.solved = true;
      return;
    }
    
    // 总电流
    const totalI = battery.voltage / totalR;
    battery.current = totalI;
    
    // 分配电流和电压
    this._distributeCurrentVoltage(topology, battery.voltage, totalI);
    
    // 更新电流表/电压表
    for (const [, comp] of this.components) {
      if (comp.type === 'ammeter') {
        comp.current = totalI; // 简化：电流表读数为总电流
        comp.voltage = 0;
      }
    }
    
    this.solved = true;
  }
  
  _analyzeTopology(components) {
    // 简化分析：根据实验配置判断串联还是并联
    // 对于初中物理，电路要么纯串联要么纯并联，不会有复杂混联
    
    if (components.length === 1) {
      const comp = components[0];
      return {
        type: 'single',
        equivalentResistance: comp.getEffectiveResistance(),
        components: [comp]
      };
    }
    
    // 检查电路配置中的标记
    // 默认按串联处理，除非有并联标记
    const isParallel = this._checkParallel(components);
    
    if (isParallel) {
      const resistances = components.map(c => c.getEffectiveResistance()).filter(r => isFinite(r) && r > 0);
      const eqR = resistances.length > 0 
        ? 1 / resistances.reduce((s, r) => s + 1 / r, 0) 
        : Infinity;
      return {
        type: 'parallel',
        equivalentResistance: eqR,
        components
      };
    } else {
      const totalR = components.reduce((s, c) => s + c.getEffectiveResistance(), 0);
      return {
        type: 'series',
        equivalentResistance: totalR,
        components
      };
    }
  }
  
  _checkParallel(components) {
    // 通过连接关系判断
    // 如果有两个元件共享两个节点（都连在同一对节点上），则为并联
    const terminalToNode = this._buildNodeGraph();
    
    const componentNodes = new Map();
    for (const comp of components) {
      const nodeA = terminalToNode.get(`${comp.id}:a`);
      const nodeB = terminalToNode.get(`${comp.id}:b`);
      if (nodeA !== undefined && nodeB !== undefined) {
        const key = [Math.min(nodeA, nodeB), Math.max(nodeA, nodeB)].join('-');
        componentNodes.set(comp.id, key);
      }
    }
    
    // 如果所有负载元件连接在相同的两个节点之间，则为并联
    const nodeKeys = new Set(componentNodes.values());
    return components.length >= 2 && nodeKeys.size === 1;
  }
  
  _distributeCurrentVoltage(topology, totalVoltage, totalCurrent) {
    if (topology.type === 'single') {
      const comp = topology.components[0];
      comp.current = totalCurrent;
      comp.voltage = totalVoltage;
      comp.power = comp.voltage * comp.current;
      if (comp.type === 'bulb') {
        comp.brightness = Math.min(1, comp.power / (comp.ratedPower || comp.power || 1));
      }
    } else if (topology.type === 'series') {
      // 串联：电流相同，电压按电阻分配
      for (const comp of topology.components) {
        comp.current = totalCurrent;
        const R = comp.getEffectiveResistance();
        comp.voltage = totalCurrent * R;
        comp.power = comp.voltage * comp.current;
        if (comp.type === 'bulb') {
          comp.brightness = Math.min(1, comp.power / (comp.ratedPower || comp.power || 1));
        }
      }
    } else if (topology.type === 'parallel') {
      // 并联：电压相同，电流按电阻分配
      for (const comp of topology.components) {
        comp.voltage = totalVoltage;
        const R = comp.getEffectiveResistance();
        comp.current = R > 0 && isFinite(R) ? totalVoltage / R : 0;
        comp.power = comp.voltage * comp.current;
        if (comp.type === 'bulb') {
          comp.brightness = Math.min(1, comp.power / (comp.ratedPower || comp.power || 1));
        }
      }
    }
  }
}

// === 预设电路工厂 ===

export function createSimpleCircuit(voltage = 3) {
  const circuit = new Circuit();
  circuit.addComponent({ id: 'bat', type: 'battery', voltage, label: '电源' });
  circuit.addComponent({ id: 'sw', type: 'switch', isOn: false, label: '开关' });
  circuit.addComponent({ id: 'bulb1', type: 'bulb', resistance: 10, ratedPower: 0.9, label: '灯泡' });
  
  circuit.connect('bat', 'b', 'sw', 'a');
  circuit.connect('sw', 'b', 'bulb1', 'a');
  circuit.connect('bulb1', 'b', 'bat', 'a');
  
  return circuit;
}

export function createSeriesCircuit(voltage = 6) {
  const circuit = new Circuit();
  circuit.addComponent({ id: 'bat', type: 'battery', voltage, label: '电源' });
  circuit.addComponent({ id: 'sw', type: 'switch', isOn: false, label: '开关' });
  circuit.addComponent({ id: 'bulb1', type: 'bulb', resistance: 10, ratedPower: 1.8, label: '灯泡L₁' });
  circuit.addComponent({ id: 'bulb2', type: 'bulb', resistance: 15, ratedPower: 1.2, label: '灯泡L₂' });
  circuit.addComponent({ id: 'am', type: 'ammeter', label: '电流表' });
  
  circuit.connect('bat', 'b', 'sw', 'a');
  circuit.connect('sw', 'b', 'bulb1', 'a');
  circuit.connect('bulb1', 'b', 'bulb2', 'a');
  circuit.connect('bulb2', 'b', 'am', 'a');
  circuit.connect('am', 'b', 'bat', 'a');
  
  return circuit;
}

export function createParallelCircuit(voltage = 6) {
  const circuit = new Circuit();
  circuit.addComponent({ id: 'bat', type: 'battery', voltage, label: '电源' });
  circuit.addComponent({ id: 'sw', type: 'switch', isOn: false, label: '总开关' });
  circuit.addComponent({ id: 'bulb1', type: 'bulb', resistance: 10, ratedPower: 3.6, label: '灯泡L₁' });
  circuit.addComponent({ id: 'bulb2', type: 'bulb', resistance: 15, ratedPower: 2.4, label: '灯泡L₂' });
  
  // 并联：两灯泡共享同一对节点
  circuit.connect('bat', 'b', 'sw', 'a');
  circuit.connect('sw', 'b', 'bulb1', 'a');
  circuit.connect('sw', 'b', 'bulb2', 'a');
  circuit.connect('bulb1', 'b', 'bat', 'a');
  circuit.connect('bulb2', 'b', 'bat', 'a');
  
  return circuit;
}

export function createOhmLawCircuit(voltage = 6) {
  const circuit = new Circuit();
  circuit.addComponent({ id: 'bat', type: 'battery', voltage, label: '电源' });
  circuit.addComponent({ id: 'sw', type: 'switch', isOn: false, label: '开关' });
  circuit.addComponent({ id: 'R', type: 'resistor', resistance: 10, label: '定值电阻' });
  circuit.addComponent({ id: 'rh', type: 'rheostat', resistance: 20, maxResistance: 50, label: '滑动变阻器' });
  circuit.addComponent({ id: 'am', type: 'ammeter', label: '电流表' });
  
  circuit.connect('bat', 'b', 'sw', 'a');
  circuit.connect('sw', 'b', 'R', 'a');
  circuit.connect('R', 'b', 'rh', 'a');
  circuit.connect('rh', 'b', 'am', 'a');
  circuit.connect('am', 'b', 'bat', 'a');
  
  return circuit;
}

export function createMeasurePowerCircuit(voltage = 4.5) {
  const circuit = new Circuit();
  circuit.addComponent({ id: 'bat', type: 'battery', voltage, label: '电源' });
  circuit.addComponent({ id: 'sw', type: 'switch', isOn: false, label: '开关' });
  circuit.addComponent({ id: 'bulb1', type: 'bulb', resistance: 8, ratedPower: 1, label: '小灯泡' });
  circuit.addComponent({ id: 'rh', type: 'rheostat', resistance: 10, maxResistance: 30, label: '滑动变阻器' });
  circuit.addComponent({ id: 'am', type: 'ammeter', label: '电流表' });
  
  circuit.connect('bat', 'b', 'sw', 'a');
  circuit.connect('sw', 'b', 'bulb1', 'a');
  circuit.connect('bulb1', 'b', 'rh', 'a');
  circuit.connect('rh', 'b', 'am', 'a');
  circuit.connect('am', 'b', 'bat', 'a');
  
  return circuit;
}

export function createJouleLawCircuit(voltage = 6) {
  const circuit = new Circuit();
  circuit.addComponent({ id: 'bat', type: 'battery', voltage, label: '电源' });
  circuit.addComponent({ id: 'sw', type: 'switch', isOn: false, label: '开关' });
  circuit.addComponent({ id: 'R1', type: 'resistor', resistance: 5, label: '电阻R₁=5Ω' });
  circuit.addComponent({ id: 'R2', type: 'resistor', resistance: 10, label: '电阻R₂=10Ω' });
  circuit.addComponent({ id: 'am', type: 'ammeter', label: '电流表' });
  
  circuit.connect('bat', 'b', 'sw', 'a');
  circuit.connect('sw', 'b', 'R1', 'a');
  circuit.connect('R1', 'b', 'R2', 'a');
  circuit.connect('R2', 'b', 'am', 'a');
  circuit.connect('am', 'b', 'bat', 'a');
  
  return circuit;
}

// 根据实验配置创建电路
export function createCircuitFromConfig(config) {
  const circuit = new Circuit();
  
  for (const comp of config.components) {
    circuit.addComponent(comp);
  }
  
  for (const conn of config.connections) {
    circuit.connect(conn.from, conn.fromTerminal || 'b', conn.to, conn.toTerminal || 'a');
  }
  
  return circuit;
}
