import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReminderStore } from '../stores/reminderStore';
import { compoundTemplates, sceneTemplates } from '../constants/templates';
import { categoryInfo } from '../constants/messages';
import { CompoundCategory } from '@/types/reminder';

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
}

export default function TemplateSelector({ open, onClose }: TemplateSelectorProps) {
  const { importTemplateReminders, reminders } = useReminderStore();
  const [selectedCategories, setSelectedCategories] = useState<CompoundCategory[]>([]);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  function toggleCategory(cat: CompoundCategory) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setSelectedScene(null);
  }

  function selectScene(sceneId: string) {
    setSelectedScene(sceneId);
    setSelectedCategories([]);
  }

  async function handleImport() {
    setImporting(true);
    try {
      if (selectedScene) {
        const scene = sceneTemplates.find((s) => s.id === selectedScene);
        if (scene) {
          await importTemplateReminders(scene.reminders);
        }
      } else if (selectedCategories.length > 0) {
        const templates = selectedCategories.flatMap(
          (cat) => compoundTemplates[cat]
        );
        await importTemplateReminders(templates);
      }
      onClose();
    } finally {
      setImporting(false);
    }
  }

  const hasExisting = reminders.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            选择提醒模板
          </DialogTitle>
        </DialogHeader>

        {hasExisting && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            你已有 {reminders.length} 个提醒。导入模板会追加新提醒，不会覆盖现有的。
          </div>
        )}

        <Tabs defaultValue="compound" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="compound" className="flex-1">
              <Package className="w-4 h-4 mr-1.5" />
              复利模板
            </TabsTrigger>
            <TabsTrigger value="scene" className="flex-1">
              <Sparkles className="w-4 h-4 mr-1.5" />
              场景模板
            </TabsTrigger>
          </TabsList>

          {/* 复利分类模板 */}
          <TabsContent value="compound" className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              选择你想培养的复利方向，系统会导入对应的预设提醒。
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(categoryInfo) as [CompoundCategory, typeof categoryInfo.body][])
                .filter(([key]) => key !== 'custom')
                .map(([key, info]) => {
                  const templates = compoundTemplates[key];
                  const isSelected = selectedCategories.includes(key);
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCategory(key)}
                      className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="text-2xl mb-2">{info.icon}</div>
                      <div className="font-medium text-slate-700">{info.label}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {templates.length} 个预设提醒
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </TabsContent>

          {/* 场景模板 */}
          <TabsContent value="scene" className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              选择你的一天场景，一键导入整套提醒方案。
            </p>
            <div className="space-y-3">
              {sceneTemplates.map((scene) => {
                const isSelected = selectedScene === scene.id;
                return (
                  <motion.button
                    key={scene.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => selectScene(scene.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-violet-400 bg-violet-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{scene.icon}</span>
                      <div>
                        <div className="font-medium text-slate-700">{scene.name}</div>
                        <div className="text-xs text-slate-400">{scene.description}</div>
                      </div>
                      {isSelected && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scene.reminders.map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {r.time} {r.title}
                        </Badge>
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* 操作栏 */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedCategories.length === 0 && !selectedScene}
            className="bg-violet-500 hover:bg-violet-600"
          >
            {importing ? '导入中...' : '导入选中模板'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
