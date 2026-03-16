// 数据存储
const DB_KEY = 'gongkao_records';

// 模块配置
const MODULES = {
    '知觉速度': { total: 60, maxScore: 12, targetRate: 0.85 },
    '政治理论': { total: 15, maxScore: 9, targetRate: 0.80 },
    '常识判断': { total: 15, maxScore: 9, targetRate: 0.60 },
    '言语理解': { total: 25, maxScore: 20, targetRate: 0.80 },
    '数量关系': { total: 10, maxScore: 8, targetRate: 0.50 },
    '判断推理': { total: 35, maxScore: 22, targetRate: 0.85 },
    '资料分析': { total: 20, maxScore: 20, targetRate: 0.90 }
};

// 获取所有记录
function getRecords() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
}

// 保存记录
function saveRecords(records) {
    localStorage.setItem(DB_KEY, JSON.stringify(records));
}

// 添加单题记录
function addSingleRecord(module, correct, total, time, note) {
    const records = getRecords();
    const now = new Date();
    
    records.push({
        id: Date.now(),
        type: 'single',
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        module,
        correct: parseInt(correct),
        total: parseInt(total),
        minutes: time ? parseFloat(time) : 0,
        note: note || ''
    });
    
    saveRecords(records);
    showToast('✅ 保存成功！');
}

// 添加套题记录
function addFullRecord(score, totalMinutes, shenlunScore, note) {
    const records = getRecords();
    const now = new Date();
    
    records.push({
        id: Date.now(),
        type: 'full',
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        score: parseFloat(score),
        minutes: totalMinutes ? parseFloat(totalMinutes) : 0,
        shenlunScore: shenlunScore ? parseFloat(shenlunScore) : 0,
        note: note || ''
    });
    
    saveRecords(records);
    showToast('✅ 套题保存成功！');
}

// 删除记录
function deleteRecord(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    const records = getRecords().filter(r => r.id !== id);
    saveRecords(records);
    renderHistory();
    renderSummary();
    showToast('🗑️ 已删除');
}

// 获取今日记录
function getTodayRecords() {
    const today = new Date().toISOString().split('T')[0];
    return getRecords().filter(r => r.date === today);
}

// 计算正确率
function calcRate(correct, total) {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// 渲染汇总
function renderSummary() {
    const todayRecords = getTodayRecords();
    const singleRecords = todayRecords.filter(r => r.type === 'single');
    const fullRecords = todayRecords.filter(r => r.type === 'full');
    
    // 今日统计
    let totalCorrect = 0, totalQuestions = 0, totalTime = 0;
    const moduleStats = {};
    
    singleRecords.forEach(r => {
        totalCorrect += r.correct;
        totalQuestions += r.total;
        totalTime += r.minutes;
        
        if (!moduleStats[r.module]) {
            moduleStats[r.module] = { correct: 0, total: 0, time: 0, count: 0 };
        }
        moduleStats[r.module].correct += r.correct;
        moduleStats[r.module].total += r.total;
        moduleStats[r.module].time += r.minutes;
        moduleStats[r.module].count += 1;
    });
    
    const todayRate = calcRate(totalCorrect, totalQuestions);
    const fullCount = fullRecords.length;
    
    document.getElementById('todaySummary').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${todayRate}%</div>
            <div class="stat-label">今日正确率</div>
        </div>
        <div class="stat-card success">
            <div class="stat-value">${totalQuestions}</div>
            <div class="stat-label">今日做题</div>
        </div>
        <div class="stat-card warning">
            <div class="stat-value">${Math.round(totalTime)}</div>
            <div class="stat-label">今日用时(分)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${fullCount}</div>
            <div class="stat-label">今日套题</div>
        </div>
    `;
    
    // 各模块统计
    let moduleHtml = '';
    for (const [module, config] of Object.entries(MODULES)) {
        const stat = moduleStats[module] || { correct: 0, total: 0, count: 0 };
        const rate = calcRate(stat.correct, stat.total);
        const targetRate = Math.round(config.targetRate * 100);
        const color = rate >= targetRate ? 'var(--success)' : (rate >= targetRate * 0.8 ? 'var(--warning)' : 'var(--danger)');
        
        moduleHtml += `
            <div class="stat-item">
                <div style="flex:1">
                    <div class="module-name">${module}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${rate}%;background:${color}"></div>
                    </div>
                </div>
                <div class="module-rate" style="color:${color}">${rate}%</div>
                <div class="module-detail">${stat.correct}/${stat.total}题</div>
            </div>
        `;
    }
    
    document.getElementById('moduleStats').innerHTML = moduleHtml || '<div class="empty-state"><div class="icon">📊</div>暂无数据，快去录入吧！</div>';
}

// 渲染历史
function renderHistory() {
    const records = getRecords().sort((a, b) => b.id - a.id);
    const list = document.getElementById('historyList');
    
    if (records.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="icon">📝</div>还没有记录哦</div>';
        return;
    }
    
    list.innerHTML = records.map(r => {
        const dateTime = `${r.date} ${r.time}`;
        
        if (r.type === 'single') {
            const rate = calcRate(r.correct, r.total);
            return `
                <div class="history-item">
                    <div class="history-header-row">
                        <span class="history-time">${dateTime}</span>
                    </div>
                    <div class="history-content">
                        <span class="module">${r.module}</span> 
                        <span class="score">${r.correct}/${r.total}</span> 
                        正确率 <span class="score">${rate}%</span>
                        ${r.minutes ? `<span style="color:#999">(${r.minutes}分钟)</span>` : ''}
                    </div>
                    ${r.note ? `<div class="history-note">💭 ${r.note}</div>` : ''}
                    <div class="history-actions">
                        <button class="btn-delete" onclick="deleteRecord(${r.id})">删除</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="history-item full-set">
                    <div class="history-header-row">
                        <span class="history-time">${dateTime}</span>
                        <span style="color:var(--success);font-weight:bold">套题</span>
                    </div>
                    <div class="history-content">
                        行测 <span class="score">${r.score}分</span>
                        ${r.shenlunScore ? `/ 申论 ${r.shenlunScore}分` : ''}
                        ${r.minutes ? `<span style="color:#999">(${r.minutes}分钟)</span>` : ''}
                    </div>
                    ${r.note ? `<div class="history-note">💭 ${r.note}</div>` : ''}
                    <div class="history-actions">
                        <button class="btn-delete" onclick="deleteRecord(${r.id})">删除</button>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// 显示提示
function showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2000);
}

// 导出数据
function exportData() {
    const data = getRecords();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `gongkao_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('📤 导出成功！');
}

// 导入数据
function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                saveRecords(data);
                renderHistory();
                renderSummary();
                showToast('📥 导入成功！');
            } else {
                showToast('❌ 文件格式错误');
            }
        } catch {
            showToast('❌ 无法解析文件');
        }
    };
    reader.readAsText(file);
}

// 清空数据
function clearAllData() {
    if (!confirm('⚠️ 确定要清空所有数据吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：真的要全部删除吗？')) return;
    
    localStorage.removeItem(DB_KEY);
    renderHistory();
    renderSummary();
    showToast('🗑️ 已清空所有数据');
}

// 标签切换
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        if (btn.dataset.tab === 'summary') renderSummary();
        if (btn.dataset.tab === 'history') renderHistory();
    });
});

// 单题表单
document.getElementById('singleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const module = document.getElementById('singleModule').value;
    const correct = document.getElementById('singleCorrect').value;
    const total = document.getElementById('singleTotal').value;
    const time = document.getElementById('singleTime').value;
    const note = document.getElementById('singleNote').value;
    
    if (parseInt(correct) > parseInt(total)) {
        showToast('❌ 正确题数不能大于总题数');
        return;
    }
    
    addSingleRecord(module, correct, total, time, note);
    e.target.reset();
    document.getElementById('singleModule').value = module; // 保留科目选择
});

// 套题表单
document.getElementById('fullForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const score = document.getElementById('fullScore').value;
    const time = document.getElementById('fullTime').value;
    const shenlun = document.getElementById('shenlunScore').value;
    const note = document.getElementById('fullNote').value;
    
    addFullRecord(score, time, shenlun, note);
    e.target.reset();
});

// 导出按钮
document.getElementById('exportBtn').addEventListener('click', exportData);

// 导入按钮
document.getElementById('importBtn').addEventListener('change', (e) => {
    if (e.target.files[0]) {
        importData(e.target.files[0]);
    }
});

// 清空按钮
document.getElementById('clearBtn').addEventListener('click', clearAllData);

// 初始化
renderSummary();
