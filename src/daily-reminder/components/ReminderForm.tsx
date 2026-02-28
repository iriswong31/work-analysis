import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Reminder,
  RepeatType,
  CompoundCategory,
} from '@/types/reminder';

// 分类排序：custom排最后
const categoryOrder: CompoundCategory[] = ['health', 'finance', 'relation', 'creation', 'joy', 'skill', 'cognition', 'custom'];
import { categoryInfo } from '../constants/messages';
import { useReminderStore } from '../stores/reminderStore';
import { aiSuggestReminder, type ReminderSuggestion } from '../utils/ai';

interface ReminderFormProps {
  open: boolean;
  onClose: () => void;
  editingReminder?: Reminder | null;
}

const repeatOptions: { value: RepeatType; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekdays', label: '工作日' },
  { value: 'weekends', label: '周末' },
  { value: 'weekly', label: '每周（指定周几）' },
  { value: 'weekly_times', label: '每周（指定次数）' },
  { value: 'monthly', label: '每月（指定日期）' },
  { value: 'monthly_times', label: '每月（指定次数）' },
  { value: 'once', label: '仅一次' },
];

const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

/** 解析日期文本为数字数组，支持逗号/空格/顿号分隔 */
function parseMonthDays(text: string): number[] {
  return text
    .split(/[,，、\s]+/)
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 31)
    .filter((v, i, a) => a.indexOf(v) === i) // 去重
    .sort((a, b) => a - b);
}

export default function ReminderForm({ open, onClose, editingReminder }: ReminderFormProps) {
  const { addReminder, updateReminder, deleteReminder, webhookConfig } = useReminderStore();
  const isEditing = !!editingReminder;

  // 如果已配置 webhook，默认开启推送
  const defaultWebhookEnabled = !!(webhookConfig?.enabled && webhookConfig?.url);

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [repeat, setRepeat] = useState<RepeatType>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDaysText, setMonthDaysText] = useState('1');
  const [weeklyTimesTarget, setWeeklyTimesTarget] = useState(3);
  const [monthlyTimesTarget, setMonthlyTimesTarget] = useState(2);
  const [category, setCategory] = useState<CompoundCategory>('custom');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [webhookEnabled, setWebhookEnabled] = useState(defaultWebhookEnabled);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI 预填
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReason, setAiReason] = useState('');
  const aiTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastAiTitleRef = useRef('');

  // 标题变化后延迟调用 AI（仅新建模式）
  const triggerAISuggest = useCallback((inputTitle: string) => {
    if (isEditing) return;
    const trimmed = inputTitle.trim();
    if (trimmed.length < 2 || trimmed === lastAiTitleRef.current) return;

    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(async () => {
      lastAiTitleRef.current = trimmed;
      setAiLoading(true);
      setAiReason('');
      try {
        const suggestion = await aiSuggestReminder(trimmed);
        if (suggestion && lastAiTitleRef.current === trimmed) {
          setTime(suggestion.time);
          if (suggestion.endTime) setEndTime(suggestion.endTime);
          setCategory(suggestion.category as CompoundCategory);
          setRepeat(suggestion.repeat as RepeatType);
          setAiReason(suggestion.reason);
        }
      } catch { /* ignore */ }
      setAiLoading(false);
    }, 800);
  }, [isEditing]);

  // 填充编辑数据
  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setTime(editingReminder.time || '');
      setEndTime(editingReminder.endTime || '');
      setRepeat(editingReminder.repeat);
      setWeekDays(editingReminder.weekDays || []);
      setMonthDaysText((editingReminder.monthDays || [1]).join(', '));
      setWeeklyTimesTarget(editingReminder.weeklyTimesTarget || 3);
      setMonthlyTimesTarget(editingReminder.monthlyTimesTarget || 2);
      setCategory(editingReminder.category);
      setSoundEnabled(editingReminder.soundEnabled);
      setWebhookEnabled(editingReminder.webhookEnabled);
    } else {
      resetForm();
    }
  }, [editingReminder, open]);

  function resetForm() {
    setTitle('');
    setTime('');
    setEndTime('');
    setRepeat('daily');
    setWeekDays([]);
    setMonthDaysText('1');
    setWeeklyTimesTarget(3);
    setMonthlyTimesTarget(2);
    setCategory('custom');
    setSoundEnabled(true);
    setWebhookEnabled(defaultWebhookEnabled);
    setAiLoading(false);
    setAiReason('');
    lastAiTitleRef.current = '';
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }

  function toggleWeekDay(day: number) {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit() {
    if (!title.trim()) return;

    // 时间为空 → 不限制时间，自动关闭企微推送
    const hasTime = !!time.trim();

    const data = {
      title: title.trim(),
      time: time || '',
      endTime: endTime || undefined,
      repeat,
      weekDays: repeat === 'weekly' ? weekDays : undefined,
      monthDays: repeat === 'monthly' ? parseMonthDays(monthDaysText) : undefined,
      weeklyTimesTarget: repeat === 'weekly_times' ? weeklyTimesTarget : undefined,
      monthlyTimesTarget: repeat === 'monthly_times' ? monthlyTimesTarget : undefined,
      category,
      urgency: 'gentle' as const,
      enabled: true,
      soundEnabled: hasTime ? soundEnabled : false,
      webhookEnabled: hasTime ? webhookEnabled : false,
    };

    if (isEditing) {
      await updateReminder(editingReminder!.id, data);
    } else {
      await addReminder(data);
    }

    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? '编辑提醒' : '新建提醒'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* 标题 */}
          <div>
            <Label className="text-sm text-slate-600">提醒名称</Label>
            <div className="relative">
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  triggerAISuggest(e.target.value);
                }}
                placeholder="例：晨起一杯温水"
                className="mt-1.5 pr-8"
              />
              {aiLoading && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 mt-0.5">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                </div>
              )}
            </div>
            {aiReason && !isEditing && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-violet-500">
                <Sparkles className="w-3 h-3" />
                <span>AI 建议：{aiReason}</span>
              </div>
            )}
          </div>

          {/* 时间 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-sm text-slate-600">开始时间</Label>
              <Select
                value={time || '__none__'}
                onValueChange={(v) => {
                  if (v === '__none__') {
                    setTime('');
                    setWebhookEnabled(false);
                    setSoundEnabled(false);
                  } else if (v === '__custom__') {
                    setTime('09:00');
                  } else {
                    setTime(v);
                  }
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="选择时间">
                    {time ? time : '不限时间'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">不限时间</SelectItem>
                  <SelectItem value="06:00">06:00 早起</SelectItem>
                  <SelectItem value="07:00">07:00</SelectItem>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="12:00">12:00 午间</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="17:00">17:00</SelectItem>
                  <SelectItem value="19:00">19:00 晚间</SelectItem>
                  <SelectItem value="20:00">20:00</SelectItem>
                  <SelectItem value="21:00">21:00</SelectItem>
                  <SelectItem value="22:00">22:00 睡前</SelectItem>
                  <SelectItem value="__custom__">自定义时间...</SelectItem>
                </SelectContent>
              </Select>
              {time && (
                <div className="mt-1.5">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              {!time && (
                <p className="text-xs text-slate-400 mt-1">不限时间 = 这天做了即可，不推送提醒</p>
              )}
            </div>
            <div className="flex-1">
              <Label className="text-sm text-slate-600">结束时间（可选）</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5"
                placeholder="留空则为即时提醒"
                disabled={!time}
              />
            </div>
          </div>

          {/* 重复 */}
          <div>
            <Label className="text-sm text-slate-600">重复</Label>
            <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeatOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 周几选择 */}
          {repeat === 'weekly' && (
            <div>
              <Label className="text-sm text-slate-600">选择星期</Label>
              <div className="flex gap-1.5 mt-1.5">
                {weekDayLabels.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekDay(idx)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                      weekDays.includes(idx)
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 每周次数选择 */}
          {repeat === 'weekly_times' && (
            <div>
              <Label className="text-sm text-slate-600">每周完成次数</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setWeeklyTimesTarget(n)}
                      className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                        weeklyTimesTarget === n
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-slate-500">次/周</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">不限制周几，灵活安排时间</p>
            </div>
          )}

          {/* 月几号 — 手填多个日期 */}
          {repeat === 'monthly' && (
            <div>
              <Label className="text-sm text-slate-600">每月几号</Label>
              <Input
                value={monthDaysText}
                onChange={(e) => setMonthDaysText(e.target.value)}
                placeholder="如：1, 15, 28"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">多个日期用逗号分隔，如 1, 15, 28</p>
            </div>
          )}

          {/* 每月次数 — 直接输入 */}
          {repeat === 'monthly_times' && (
            <div>
              <Label className="text-sm text-slate-600">每月完成次数</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={monthlyTimesTarget}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (v >= 1 && v <= 31) setMonthlyTimesTarget(v);
                    else if (e.target.value === '') setMonthlyTimesTarget(1);
                  }}
                  className="w-24"
                />
                <span className="text-sm text-slate-500">次/月</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">不限制日期，灵活安排时间</p>
            </div>
          )}

          {/* 分类 */}
          <div>
            <Label className="text-sm text-slate-600">复利分类</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CompoundCategory)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryInfo)
                  .sort(([a], [b]) => categoryOrder.indexOf(a as CompoundCategory) - categoryOrder.indexOf(b as CompoundCategory))
                  .map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.icon} {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 开关 */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-600">声音提醒</Label>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                disabled={!time}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-600">企业微信推送</Label>
              <Switch
                checked={webhookEnabled}
                onCheckedChange={setWebhookEnabled}
                disabled={!time}
              />
            </div>
            {!time && (
              <p className="text-xs text-amber-500">未设置时间，声音提醒和企微推送已自动关闭</p>
            )}
          </div>

          {/* 提交 */}
          <div className="flex justify-between gap-2 pt-2">
            <div>
              {isEditing && !showDeleteConfirm && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  删除
                </Button>
              )}
              {isEditing && showDeleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-500">确认删除？</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await deleteReminder(editingReminder!.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }}
                    className="text-rose-600 border-rose-300 hover:bg-rose-100 text-xs px-2 py-1 h-7"
                  >
                    确认
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xs px-2 py-1 h-7"
                  >
                    取消
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="bg-violet-500 hover:bg-violet-600"
              >
                {isEditing ? '保存修改' : '创建提醒'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
