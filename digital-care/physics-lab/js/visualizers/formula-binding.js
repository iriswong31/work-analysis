/**
 * AIGP 物理实验室 — 公式-参数双向绑定引擎
 */

export class FormulaBinding {
  constructor(container) {
    this.container = container;
    this.formulas = [];
    this.variables = {};
    this.onChange = null;
  }
  
  /** 注册公式 */
  addFormula(id, formula, variables) {
    this.formulas.push({ id, formula, variables });
    
    // 初始化变量
    for (const v of variables) {
      if (!(v.name in this.variables)) {
        this.variables[v.name] = v.default || 0;
      }
    }
    
    this.render();
  }
  
  /** 设置变量值 */
  setVariable(name, value) {
    this.variables[name] = value;
    this.render();
    if (this.onChange) {
      this.onChange(name, value, this.variables);
    }
  }
  
  /** 渲染 */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = this.formulas.map(f => {
      // 替换变量为当前值
      let display = f.formula;
      for (const v of f.variables) {
        const val = this.variables[v.name];
        display = display.replace(
          new RegExp(v.symbol || v.name, 'g'),
          `<span class="formula-var" data-var="${v.name}" style="color:${v.color || '#4a9eff'};cursor:pointer;text-decoration:underline dotted">${val !== undefined ? val.toFixed(v.decimals || 1) : v.name}</span>`
        );
      }
      
      return `
        <div class="formula-box" style="text-align:left;padding:12px;font-size:14px">
          <div style="margin-bottom:8px">${display} ${f.variables.length > 0 ? f.variables.map(v => `<span style="color:${v.color || '#4a9eff'};font-size:11px">${v.name}=${(this.variables[v.name] || 0).toFixed(v.decimals || 1)}${v.unit || ''}</span>`).join(' · ') : ''}</div>
          ${f.variables.filter(v => v.adjustable !== false).map(v => `
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
              <span style="font-size:11px;color:var(--text-muted);min-width:20px">${v.symbol || v.name}</span>
              <input type="range" min="${v.min || 0}" max="${v.max || 100}" step="${v.step || 0.1}" 
                value="${this.variables[v.name] || 0}" data-var="${v.name}"
                style="flex:1;accent-color:${v.color || '#4a9eff'}">
              <span style="font-size:11px;font-family:var(--font-mono);color:${v.color || '#4a9eff'};min-width:50px">
                ${(this.variables[v.name] || 0).toFixed(v.decimals || 1)}${v.unit || ''}
              </span>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
    
    // 绑定滑块事件
    this.container.querySelectorAll('input[type=range]').forEach(input => {
      input.addEventListener('input', (e) => {
        const name = e.target.dataset.var;
        const value = parseFloat(e.target.value);
        this.setVariable(name, value);
      });
    });
  }
}
