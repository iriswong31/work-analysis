import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Lightbulb,
  ChevronRight,
  Check,
  Trash2,
  Pencil,
  RefreshCw,
  Bell,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIdeaStore } from '../stores/ideaStore';
import { useReminderStore } from '../stores/reminderStore';
import { categoryInfo } from '../constants/messages';
import { CompoundCategory, Idea, SubTask } from '@/types/reminder';
import { aiSuggestIdeaCategory } from '../utils/ai';

// 分类排序：custom排最后
const categoryOrder: CompoundCategory[] = ['health', 'finance', 'relation', 'creation', 'joy', 'skill', 'cognition', 'custom'];

/** 兼容读取：优先用 categories，回退到旧 category */
function getIdeaCategories(idea: Idea): CompoundCategory[] {
  if (idea.categories && idea.categories.length > 0) return idea.categories;
  if (idea.category) return [idea.category];
  return ['custom'];
}

function NewIdeaForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addIdea } = useIdeaStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CompoundCategory[]>(['creation']);
  const [aiCategoryLoading, setAiCategoryLoading] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastAiTitleRef = useRef('');

  const triggerAICategorySuggest = useCallback((inputTitle: string) => {
    const trimmed = inputTitle.trim();
    if (trimmed.length < 2 || trimmed === lastAiTitleRef.current) return;
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(async () => {
      lastAiTitleRef.current = trimmed;
      setAiCategoryLoading(true);
      try {
        const cats = await aiSuggestIdeaCategory(trimmed);
        if (cats && lastAiTitleRef.current === trimmed) {
          setSelectedCategories(cats as CompoundCategory[]);
        }
      } catch { /* ignore */ }
      setAiCategoryLoading(false);
    }, 800);
  }, []);

  function reset() {
    setTitle('');
    setContent('');
    setSelectedCategories(['creation']);
    setAiCategoryLoading(false);
    lastAiTitleRef.current = '';
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }

  function toggleCategory(key: CompoundCategory) {
    setSelectedCategories(prev =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter(c => c !== key) : prev) : [...prev, key]
    );
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    await addIdea(title.trim(), content.trim(), selectedCategories);
    reset();
    onClose();
  }

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--cb-color-primary-dark)' }}>
            <Lightbulb className="w-5 h-5" />
            记录灵感
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerAICategorySuggest(e.target.value);
          }}
          placeholder="灵感标题，比如「学习 Blender 做 3D 动画」"
          className="w-full text-[15px] font-medium border-b border-gray-200 pb-2 mb-3 outline-none bg-transparent"
          style={{ color: 'var(--cb-color-primary-dark)' }}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'详细描述一下你的想法（可选，写得越具体拆解越准确）\n\n比如：想学 Blender 基础建模，能做简单的 3D 场景和角色...'}
          className="w-full text-sm border border-gray-200 rounded-xl p-3 mb-3 outline-none resize-none bg-transparent"
          style={{ color: 'var(--cb-color-primary-dark)' }}
          rows={3}
        />

        <div className="mb-4">
          <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--cb-color-primary-medium)' }}>
            归属分类（可多选）
            {aiCategoryLoading && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
            {!aiCategoryLoading && title.trim().length >= 2 && <span className="text-violet-400">· AI 已推荐</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(categoryInfo) as [CompoundCategory, (typeof categoryInfo)['health']][])
              .sort(([a], [b]) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
              .map(([key, info]) => (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  selectedCategories.includes(key) ? 'bg-[#6D4C33] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {info.icon} {info.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-semibold transition-all',
            title.trim() ? 'bg-[#6D4C33] text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400'
          )}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" />
          记录并智能拆解
        </button>
      </motion.div>
    </motion.div>
  );
}

function SwipeableSubTask({
  st,
  idea,
  editingId,
  editingText,
  setEditingText,
  startEdit,
  saveEdit,
  toggleSubTask,
  deleteSubTask,
  handleConvertToReminder,
  handleCancelReminder,
}: {
  st: SubTask;
  idea: Idea;
  editingId: string | null;
  editingText: string;
  setEditingText: (v: string) => void;
  startEdit: (st: SubTask) => void;
  saveEdit: () => void;
  toggleSubTask: (ideaId: string, stId: string) => void;
  deleteSubTask: (ideaId: string, stId: string) => void;
  handleConvertToReminder: (st: SubTask) => void;
  handleCancelReminder: (st: SubTask) => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const DELETE_THRESHOLD = -80;

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    setSwiping(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;
    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }
    if (!isHorizontalRef.current) return;
    setOffsetX(Math.min(0, Math.max(-120, dx)));
  }

  function handleTouchEnd() {
    setSwiping(false);
    isHorizontalRef.current = null;
    if (offsetX < DELETE_THRESHOLD) {
      setDeleted(true);
      setTimeout(() => deleteSubTask(idea.id, st.id), 300);
    } else {
      setOffsetX(0);
    }
  }

  return (
    <AnimatePresence>
      {!deleted && (
        <motion.div
          key={st.id}
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="relative overflow-hidden rounded-[24px]"
        >
          <div className="absolute right-0 top-0 bottom-0 w-[100px] flex items-center justify-center"
            style={{ background: '#E74C3C' }}
          >
            <Trash2 className="w-5 h-5 text-white" />
          </div>

          <div
            className={cn('cb-task-card flex items-center gap-3 !py-3 !px-4 relative z-10', st.done && 'is-done')}
            style={{
              transform: `translateX(${offsetX}px)`,
              transition: swiping ? 'none' : 'transform 0.3s ease',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex-1 min-w-0">
              {editingId === st.id ? (
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className="w-full text-sm bg-transparent outline-none"
                  style={{ color: 'var(--cb-color-primary-dark)' }}
                  autoFocus
                />
              ) : (
                <p className={cn('text-sm font-medium', st.done && 'line-through opacity-60')} style={{ color: 'var(--cb-color-primary-dark)' }}>
                  {st.title}
                  {st.reminderId && <Bell className="w-3 h-3 inline ml-1.5 text-amber-500" />}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center gap-1">
              {!st.reminderId && !st.done && (
                <button onClick={() => {
                  const idx = idea.subTasks.filter(s => !s.done).indexOf(st);
                  handleConvertToReminder(st, Math.max(0, idx));
                }} className="p-1.5 rounded-full hover:bg-gray-100" title="设为提醒">
                  <Bell className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
              {st.reminderId && (
                <button onClick={() => handleCancelReminder(st)} className="p-1.5 rounded-full hover:bg-amber-50" title="取消提醒">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                </button>
              )}
              <button onClick={() => startEdit(st)} className="p-1.5 rounded-full hover:bg-gray-100" title="编辑">
                <Pencil className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                onClick={() => toggleSubTask(idea.id, st.id)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ml-1',
                  st.done ? 'bg-[#A8C298] border-[#A8C298]' : 'border-gray-300/50 bg-white/50 active:border-[#A8C298] active:bg-[#A8C298]/10'
                )}
              >
                {st.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IdeaDetail({ idea, onBack }: { idea: Idea; onBack: () => void }) {
  const { toggleSubTask, addSubTask, updateSubTask, deleteSubTask, reDecompose, deleteIdea, markSubTaskAsReminder, unmarkSubTaskAsReminder, updateIdeaInfo } = useIdeaStore();
  const { addReminder, deleteReminder } = useReminderStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingIdea, setEditingIdea] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editContent, setEditContent] = useState(idea.content);
  const [editCategories, setEditCategories] = useState<CompoundCategory[]>(getIdeaCategories(idea));

  const doneCount = idea.subTasks.filter((st) => st.done).length;
  const totalCount = idea.subTasks.length;

  async function handleAddSubTask() {
    if (!newTaskTitle.trim()) return;
    await addSubTask(idea.id, newTaskTitle.trim());
    setNewTaskTitle('');
  }

  async function handleConvertToReminder(subTask: SubTask, timeOffset = 0) {
    // 根据子任务在列表中的顺序分配不同时间（从09:00开始，每个间隔30-60分钟）
    const baseHour = 9;
    const totalMinutes = baseHour * 60 + timeOffset * 45; // 每个任务间隔45分钟
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const reminder = await addReminder({
      title: subTask.title,
      time: timeStr,
      repeat: 'once',
      category: getIdeaCategories(idea)[0],
      urgency: 'gentle',
      enabled: true,
      soundEnabled: true,
      webhookEnabled: false,
      sourceIdeaId: idea.id,
    });
    await markSubTaskAsReminder(idea.id, subTask.id, reminder.id);
  }

  async function handleConvertAllToReminder() {
    const pending = idea.subTasks.filter((st) => !st.done && !st.reminderId);
    for (let i = 0; i < pending.length; i++) {
      await handleConvertToReminder(pending[i], i);
    }
  }

  async function handleCancelReminder(subTask: SubTask) {
    if (subTask.reminderId) {
      await deleteReminder(subTask.reminderId);
      await unmarkSubTaskAsReminder(idea.id, subTask.id);
    }
  }

  async function handleCancelAllReminders() {
    const withReminder = idea.subTasks.filter((st) => st.reminderId);
    for (const st of withReminder) {
      await handleCancelReminder(st);
    }
  }

  async function handleSaveIdeaEdit() {
    if (!editTitle.trim()) return;
    await updateIdeaInfo(idea.id, editTitle.trim(), editContent, editCategories);
    setEditingIdea(false);
  }

  function startEdit(st: SubTask) {
    setEditingId(st.id);
    setEditingText(st.title);
  }

  async function saveEdit() {
    if (editingId && editingText.trim()) {
      await updateSubTask(idea.id, editingId, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  }

  const ideaCats = getIdeaCategories(idea);
  const primaryInfo = categoryInfo[ideaCats[0]] || categoryInfo.custom;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--cb-color-primary-medium)' }}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        返回灵感池
      </button>

      <div className="cb-task-card !p-4 mb-4">
        {editingIdea ? (
          <div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg font-bold bg-transparent outline-none border-b border-gray-200 pb-1 mb-2"
              style={{ color: 'var(--cb-color-primary-dark)' }}
              autoFocus
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-sm bg-transparent outline-none border border-gray-200 rounded-lg p-2 mb-2 resize-none"
              style={{ color: 'var(--cb-color-primary-dark)' }}
              rows={2}
              placeholder="详细描述（可选）"
            />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(Object.entries(categoryInfo) as [CompoundCategory, (typeof categoryInfo)['health']][])
                .sort(([a], [b]) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
                .map(([key, cInfo]) => (
                <button
                  key={key}
                  onClick={() => setEditCategories(prev =>
                    prev.includes(key) ? (prev.length > 1 ? prev.filter(c => c !== key) : prev) : [...prev, key]
                  )}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    editCategories.includes(key) ? 'bg-[#6D4C33] text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {cInfo.icon} {cInfo.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveIdeaEdit}
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-[#6D4C33] text-white active:scale-[0.98] transition-all"
              >
                保存
              </button>
              <button
                onClick={() => { setEditingIdea(false); setEditTitle(idea.title); setEditContent(idea.content); setEditCategories(getIdeaCategories(idea)); }}
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-gray-100 active:bg-gray-200 transition-all"
                style={{ color: 'var(--cb-color-primary-dark)' }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex flex-wrap gap-1">
                  {ideaCats.map(cat => {
                    const ci = categoryInfo[cat] || categoryInfo.custom;
                    return (
                      <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-[#6D4C33]/10 text-[#6D4C33]">
                        {ci.icon} {ci.label}
                      </span>
                    );
                  })}
                </div>
                <h2 className="text-lg font-bold mt-2" style={{ color: 'var(--cb-color-primary-dark)' }}>
                  {idea.title}
                </h2>
                {idea.content && (
                  <p className="text-sm mt-1" style={{ color: 'var(--cb-color-primary-medium)' }}>{idea.content}</p>
                )}
              </div>
              <button onClick={() => setEditingIdea(true)} className="p-1.5 rounded-full hover:bg-gray-100 flex-shrink-0 ml-2" title="编辑灵感">
                <Pencil className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#A8C298] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--cb-color-primary-medium)' }}>
                {doneCount}/{totalCount}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => reDecompose(idea.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-gray-100 active:bg-gray-200 transition-all"
          style={{ color: 'var(--cb-color-primary-dark)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重新拆解
        </button>
        {(() => {
          const pendingNoReminder = idea.subTasks.filter((st) => !st.done && !st.reminderId);
          const withReminder = idea.subTasks.filter((st) => st.reminderId);
          const allSetAsReminder = pendingNoReminder.length === 0 && withReminder.length > 0;
          return allSetAsReminder ? (
            <button
              onClick={handleCancelAllReminders}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-amber-50 active:bg-amber-100 transition-all"
              style={{ color: '#B45309' }}
            >
              <Bell className="w-3.5 h-3.5" />
              取消全部提醒
            </button>
          ) : (
            <button
              onClick={handleConvertAllToReminder}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-[#6D4C33]/10 active:bg-[#6D4C33]/20 transition-all"
              style={{ color: '#6D4C33' }}
            >
              <Bell className="w-3.5 h-3.5" />
              全部设为提醒
            </button>
          );
        })()}
        <button
          onClick={async () => { await deleteIdea(idea.id); onBack(); }}
          className="px-3 py-2 rounded-xl text-xs font-medium bg-rose-50 text-rose-500 active:bg-rose-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
          {idea.subTasks.map((st) => (
            <SwipeableSubTask
              key={st.id}
              st={st}
              idea={idea}
              editingId={editingId}
              editingText={editingText}
              setEditingText={setEditingText}
              startEdit={startEdit}
              saveEdit={saveEdit}
              toggleSubTask={toggleSubTask}
              deleteSubTask={deleteSubTask}
              handleConvertToReminder={handleConvertToReminder}
              handleCancelReminder={handleCancelReminder}
            />
          ))}

        <div className="flex gap-2 mt-3">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="添加新的子任务..."
            className="flex-1 text-sm bg-white/60 border border-gray-200 rounded-xl px-3 py-2.5 outline-none"
            style={{ color: 'var(--cb-color-primary-dark)' }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
          />
          <button
            onClick={handleAddSubTask}
            disabled={!newTaskTitle.trim()}
            className={cn(
              'px-4 rounded-xl text-sm font-medium transition-all',
              newTaskTitle.trim() ? 'bg-[#6D4C33] text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400'
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function IdeaPool() {
  const { ideas, loadIdeas } = useIdeaStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const activeIdea = ideas.find((i) => i.id === selectedIdea);

  if (activeIdea) {
    return <IdeaDetail idea={activeIdea} onBack={() => setSelectedIdea(null)} />;
  }

  const openIdeas = ideas.filter((i) => i.status !== 'done' && i.status !== 'archived');
  const doneIdeas = ideas.filter((i) => i.status === 'done');

  return (
    <>
      <AnimatePresence>
        {showForm && <NewIdeaForm open={showForm} onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {ideas.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 pb-24">
          <div className="text-6xl mb-6">💡</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--cb-color-primary-dark)' }}>灵感池</h2>
          <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: 'var(--cb-color-primary-medium)' }}>
            随时记录灵感和想法，<br />系统会自动拆解为可执行的小任务。
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#6D4C33] text-white active:scale-[0.98] transition-all"
          >
            <Lightbulb className="w-4 h-4" />
            记录第一个灵感
          </button>
        </motion.div>
      ) : (
        <div className="pb-20">
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl border-2 border-dashed border-gray-300/60 text-sm font-medium transition-all active:bg-gray-50"
            style={{ color: 'var(--cb-color-primary-medium)' }}
          >
            <Plus className="w-4 h-4" />
            记录新灵感
          </button>

          <div className="space-y-2">
            <AnimatePresence>
              {openIdeas.map((idea) => {
                const cats = getIdeaCategories(idea);
                const info = categoryInfo[cats[0]] || categoryInfo.custom;
                const doneCount = idea.subTasks.filter((st) => st.done).length;
                const totalCount = idea.subTasks.length;
                return (
                  <motion.div
                    key={idea.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="cb-task-card !p-4 cursor-pointer active:scale-[0.99] transition-transform"
                    onClick={() => setSelectedIdea(idea.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{info.icon}</span>
                          <h3 className="font-semibold text-[15px] truncate" style={{ color: 'var(--cb-color-primary-dark)' }}>
                            {idea.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[120px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#A8C298] rounded-full transition-all"
                              style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="text-[11px]" style={{ color: 'var(--cb-color-primary-medium)' }}>
                            {doneCount}/{totalCount} 步
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {doneIdeas.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--cb-color-primary-medium)' }}>
                已完成 ({doneIdeas.length})
              </p>
              <div className="space-y-2">
                {doneIdeas.map((idea) => {
                  const cats = getIdeaCategories(idea);
                  const info = categoryInfo[cats[0]] || categoryInfo.custom;
                  return (
                    <div
                      key={idea.id}
                      className="cb-task-card is-done !p-3 cursor-pointer"
                      onClick={() => setSelectedIdea(idea.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#A8C298] flex-shrink-0" />
                        <span className="text-sm line-through opacity-60" style={{ color: 'var(--cb-color-primary-dark)' }}>
                          {info.icon} {idea.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
