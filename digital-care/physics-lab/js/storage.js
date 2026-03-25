/**
 * AIGP 物理实验室 — IndexedDB 本地存储
 */

const DB_NAME = 'aigp-physics-lab';
const DB_VERSION = 1;
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('mastery')) {
        d.createObjectStore('mastery', { keyPath: 'knowledgeId' });
      }
      if (!d.objectStoreNames.contains('experiments')) {
        d.createObjectStore('experiments', { keyPath: 'experimentId' });
      }
      if (!d.objectStoreNames.contains('answers')) {
        const store = d.createObjectStore('answers', { keyPath: 'id', autoIncrement: true });
        store.createIndex('knowledgeId', 'knowledgeId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!d.objectStoreNames.contains('settings')) {
        d.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function initDB() {
  return openDB();
}

// === 掌握度 ===

export async function getMastery(knowledgeId) {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('mastery', 'readonly');
    const req = tx.objectStore('mastery').get(knowledgeId);
    req.onsuccess = () => resolve(req.result?.score || 0);
    req.onerror = () => resolve(0);
  });
}

export async function getAllMastery() {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('mastery', 'readonly');
    const req = tx.objectStore('mastery').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function updateMastery(knowledgeId, delta) {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('mastery', 'readwrite');
    const store = tx.objectStore('mastery');
    const getReq = store.get(knowledgeId);
    getReq.onsuccess = () => {
      const current = getReq.result?.score || 0;
      const newScore = Math.max(0, Math.min(100, current + delta));
      store.put({ knowledgeId, score: newScore, updatedAt: Date.now() });
      resolve(newScore);
    };
    getReq.onerror = () => resolve(0);
  });
}

export async function setMastery(knowledgeId, score) {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('mastery', 'readwrite');
    tx.objectStore('mastery').put({ knowledgeId, score: Math.max(0, Math.min(100, score)), updatedAt: Date.now() });
    tx.oncomplete = () => resolve(score);
  });
}

// === 实验记录 ===

export async function completeExperiment(experimentId) {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('experiments', 'readwrite');
    tx.objectStore('experiments').put({
      experimentId,
      completedAt: Date.now(),
      completed: true
    });
    tx.oncomplete = () => resolve(true);
  });
}

export async function getExperimentStatus(experimentId) {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('experiments', 'readonly');
    const req = tx.objectStore('experiments').get(experimentId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function getAllExperiments() {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('experiments', 'readonly');
    const req = tx.objectStore('experiments').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

// === 答题记录 ===

export async function recordAnswer(questionId, knowledgeId, isCorrect, difficulty) {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('answers', 'readwrite');
    tx.objectStore('answers').add({
      questionId,
      knowledgeId,
      isCorrect,
      difficulty,
      timestamp: Date.now()
    });
    tx.oncomplete = () => resolve(true);
  });
}

export async function getRecentAnswers(limit = 20) {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction('answers', 'readonly');
    const req = tx.objectStore('answers').getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      all.sort((a, b) => b.timestamp - a.timestamp);
      resolve(all.slice(0, limit));
    };
    req.onerror = () => resolve([]);
  });
}

// === 统计 ===

export async function getKnowledgeStats() {
  const mastery = await getAllMastery();
  const total = mastery.length;
  const learned = mastery.filter(m => m.score > 0).length;
  const mastered = mastery.filter(m => m.score >= 80).length;
  const avgScore = total > 0 ? mastery.reduce((s, m) => s + m.score, 0) / total : 0;
  return { total, learned, mastered, avgScore };
}

export async function getLearningOverview() {
  const mastery = await getAllMastery();
  const experiments = await getAllExperiments();
  const answers = await getRecentAnswers(100);
  
  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const accuracy = answers.length > 0 ? totalCorrect / answers.length : 0;
  
  return {
    masteryList: mastery,
    completedExperiments: experiments.filter(e => e.completed).length,
    totalAnswers: answers.length,
    accuracy,
    recentAnswers: answers.slice(0, 10)
  };
}

// === 重置 ===

export async function resetAllData() {
  const d = await openDB();
  return new Promise((resolve) => {
    const tx = d.transaction(['mastery', 'experiments', 'answers', 'settings'], 'readwrite');
    tx.objectStore('mastery').clear();
    tx.objectStore('experiments').clear();
    tx.objectStore('answers').clear();
    tx.objectStore('settings').clear();
    tx.oncomplete = () => resolve(true);
  });
}
