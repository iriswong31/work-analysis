/**
 * AIGP 物理实验室 — 评估引擎
 */

import { updateMastery, recordAnswer, getRecentAnswers, getAllMastery } from './storage.js';

export class AssessEngine {
  constructor() {
    this.questions = [];
    this.knowledgeTree = [];
    this.currentQuiz = null;
  }
  
  init(questions, knowledgeTree) {
    this.questions = questions || [];
    this.knowledgeTree = knowledgeTree || [];
  }
  
  // 获取某个知识点的题目
  getQuestionsByKnowledge(knowledgeId) {
    return this.questions.filter(q => q.knowledgeId === knowledgeId);
  }
  
  // 随机出一道题
  getRandomQuestion(knowledgeId) {
    const pool = knowledgeId 
      ? this.getQuestionsByKnowledge(knowledgeId) 
      : this.questions;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  // 开始一组测验
  startQuiz(knowledgeIds, count = 5) {
    let pool = [];
    if (knowledgeIds && knowledgeIds.length > 0) {
      for (const kid of knowledgeIds) {
        pool.push(...this.getQuestionsByKnowledge(kid));
      }
    } else {
      pool = [...this.questions];
    }
    
    // 洗牌
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    
    this.currentQuiz = {
      questions: pool.slice(0, count),
      answers: [],
      currentIndex: 0,
      score: 0
    };
    
    return this.currentQuiz.questions[0] || null;
  }
  
  // 提交答案
  async submitAnswer(questionId, answer) {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return null;
    
    const isCorrect = answer === question.answer;
    
    // 更新掌握度
    let delta;
    if (isCorrect) {
      delta = question.difficulty === 1 ? 8 : question.difficulty === 2 ? 10 : 15;
    } else {
      delta = question.difficulty === 1 ? -10 : question.difficulty === 2 ? -8 : -5;
    }
    
    const newScore = await updateMastery(question.knowledgeId, delta);
    await recordAnswer(questionId, question.knowledgeId, isCorrect, question.difficulty);
    
    const result = {
      questionId,
      isCorrect,
      correctAnswer: question.answer,
      analysis: question.analysis,
      delta,
      newMastery: newScore
    };
    
    // 如果在测验中，更新测验状态
    if (this.currentQuiz) {
      this.currentQuiz.answers.push(result);
      if (isCorrect) this.currentQuiz.score++;
      this.currentQuiz.currentIndex++;
    }
    
    return result;
  }
  
  // 获取测验下一题
  getNextQuestion() {
    if (!this.currentQuiz) return null;
    const idx = this.currentQuiz.currentIndex;
    if (idx >= this.currentQuiz.questions.length) return null;
    return this.currentQuiz.questions[idx];
  }
  
  // 获取测验结果
  getQuizResult() {
    if (!this.currentQuiz) return null;
    const quiz = this.currentQuiz;
    return {
      total: quiz.questions.length,
      correct: quiz.score,
      accuracy: quiz.questions.length > 0 ? quiz.score / quiz.questions.length : 0,
      answers: quiz.answers
    };
  }
  
  // 章节概览
  async getChapterOverview() {
    const mastery = await getAllMastery();
    const masteryMap = new Map(mastery.map(m => [m.knowledgeId, m.score]));
    
    const chapters = [
      { id: 14, name: '第14章 了解电路' },
      { id: 15, name: '第15章 探究电路' },
      { id: 16, name: '第16章 电流做功与电功率' },
      { id: 17, name: '第17章 从指南针到磁悬浮列车' },
      { id: 18, name: '第18章 电能从哪里来' }
    ];
    
    return chapters.map(ch => {
      const sections = this.knowledgeTree.filter(k => k.chapter === ch.id);
      const scores = sections.map(s => masteryMap.get(s.id) || 0);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      
      return {
        ...ch,
        sections: sections.map(s => ({
          ...s,
          mastery: masteryMap.get(s.id) || 0
        })),
        averageMastery: Math.round(avg),
        sectionCount: sections.length,
        masteredCount: scores.filter(s => s >= 80).length
      };
    });
  }
  
  // 推荐薄弱知识点
  async getRecommendations(limit = 5) {
    const mastery = await getAllMastery();
    const masteryMap = new Map(mastery.map(m => [m.knowledgeId, m.score]));
    
    const nodes = this.knowledgeTree.map(k => ({
      ...k,
      mastery: masteryMap.get(k.id) || 0,
      priority: (k.examWeight || 5) * Math.max(0, 80 - (masteryMap.get(k.id) || 0))
    }));
    
    // 按优先级排序（考试权重 × 差距）
    nodes.sort((a, b) => b.priority - a.priority);
    
    return nodes.slice(0, limit).map(n => ({
      id: n.id,
      name: n.name,
      chapter: n.chapter,
      mastery: n.mastery,
      examWeight: n.examWeight,
      reason: n.mastery === 0 
        ? '还没有学过' 
        : n.mastery < 50 
          ? '掌握度较低，需要巩固' 
          : '接近掌握，再练习一下'
    }));
  }
}
