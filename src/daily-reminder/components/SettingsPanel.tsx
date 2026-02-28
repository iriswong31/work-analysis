import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Send, CheckCircle, XCircle, Trash2, AlertTriangle, Quote, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReminderStore } from '../stores/reminderStore';
import { testWebhook } from '../utils/webhook';
import { reminderDb } from '../utils/db';
import { useNotification } from '../hooks/useNotification';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { webhookConfig, updateWebhookConfig, clearAllReminders, reminders } =
    useReminderStore();
  const { permission, requestPermission, supported: notifSupported } = useNotification();
  const [url, setUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [motto, setMotto] = useState('');
  const [mottoSaved, setMottoSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // 防抖自动保存 webhook URL
  const debouncedSaveUrl = useCallback((v: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (v.trim() && v.includes('qyapi.weixin.qq.com')) {
        setEnabled(true);
        updateWebhookConfig({ url: v.trim(), enabled: true });
      }
    }, 500);
  }, [updateWebhookConfig]);

  useEffect(() => {
    if (webhookConfig) {
      setUrl(webhookConfig.url || '');
      setEnabled(webhookConfig.enabled);
    }
  }, [webhookConfig]);

  useEffect(() => {
    if (open) {
      reminderDb.userSettings.get('yearlyMotto').then((item) => {
        setMotto(item?.value || '');
      });
    }
  }, [open]);

  async function handleSaveMotto() {
    const value = motto.trim();
    if (value) {
      await reminderDb.userSettings.put({ key: 'yearlyMotto', value });
    } else {
      await reminderDb.userSettings.delete('yearlyMotto');
    }
    setMottoSaved(true);
    setTimeout(() => setMottoSaved(false), 2000);
    window.dispatchEvent(new CustomEvent('motto-updated'));
  }

  async function handleTestWebhook() {
    if (!url.trim()) return;
    setTesting(true);
    setTestResult(null);
    const result = await testWebhook(url.trim());
    setTestResult(result);
    setTesting(false);

    if (result.success) {
      setEnabled(true);
      await updateWebhookConfig({
        url: url.trim(),
        enabled: true,
        lastTestedAt: new Date(),
        lastTestSuccess: true,
      });
    } else {
      await updateWebhookConfig({
        url: url.trim(),
        lastTestedAt: new Date(),
        lastTestSuccess: false,
      });
    }
  }

  async function handleSaveWebhook() {
    await updateWebhookConfig({
      url: url.trim(),
      enabled,
    });
  }

  async function handleClearAll() {
    await clearAllReminders();
    setShowClearConfirm(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            设置
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* 年度宣言 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                <Quote className="w-4 h-4" />
                年度宣言
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">
                写一句话激励自己，它会显示在首页顶部。留空则不显示。
              </p>
              <Input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="例：2026，以健康为基石，让灵感作品化"
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveMotto();
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveMotto}
                  className="bg-violet-500 hover:bg-violet-600"
                >
                  保存
                </Button>
                {mottoSaved && (
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    已保存
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 通知提醒 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                通知提醒
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!notifSupported ? (
                <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                  <p className="font-medium">当前浏览器不支持系统通知</p>
                  <p className="text-xs mt-1 text-amber-500">
                    微信内置浏览器和部分手机浏览器不支持。建议用 Safari 或 Chrome 打开，或使用下方企业微信推送。
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">浏览器通知</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {permission === 'granted'
                        ? '已开启，到时间会弹出系统通知'
                        : permission === 'denied'
                          ? '已被拒绝，请在浏览器设置中开启'
                          : '开启后，到时间会弹出系统通知提醒你'}
                    </p>
                  </div>
                  {permission === 'granted' ? (
                    <span className="flex items-center gap-1 text-sm text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      已开启
                    </span>
                  ) : permission === 'denied' ? (
                    <span className="flex items-center gap-1 text-sm text-rose-500">
                      <XCircle className="w-4 h-4" />
                      已拒绝
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={requestPermission}
                    >
                      开启通知
                    </Button>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400">
                提示：即使不开启系统通知，页面打开时也会有页面内弹窗提醒和声音提醒。
              </p>
            </CardContent>
          </Card>

          {/* 企业微信推送 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700">企业微信推送</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                粘贴企业微信群机器人的 Webhook 地址，自动保存并启用推送。
              </p>

              <div>
                <Label className="text-sm text-slate-600">Webhook URL</Label>
                <Input
                  value={url}
                  onChange={(e) => {
                    const v = e.target.value;
                    setUrl(v);
                    debouncedSaveUrl(v);
                  }}
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                  className="mt-1.5 text-xs"
                />
                {enabled && url.trim() && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    推送已启用
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWebhook}
                disabled={!url.trim() || testing}
                className="w-full"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {testing ? '测试中...' : '发送测试消息'}
              </Button>

              {testResult !== null && (
                <div
                  className={`text-sm ${
                    testResult.success ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {testResult.success
                      ? '测试成功！已发送消息到企业微信'
                      : '测试失败'}
                  </div>
                  {testResult.error && (
                    <p className="text-xs mt-1 ml-6 text-rose-500">{testResult.error}</p>
                  )}
                </div>
              )}

              {enabled && url.trim() && (
                <button
                  onClick={() => {
                    setEnabled(false);
                    setUrl('');
                    updateWebhookConfig({ url: '', enabled: false });
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  关闭推送并清除地址
                </button>
              )}

              <div className="text-xs text-slate-400 space-y-1">
                <p>如何获取 Webhook URL：</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>在企业微信中创建一个群</li>
                  <li>群设置 → 群机器人 → 添加机器人</li>
                  <li>复制 Webhook 地址粘贴到上方</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* 数据管理 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700">数据管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-500">
                当前有 {reminders.length} 个提醒
              </div>

              {showClearConfirm ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    确定要清空所有提醒和记录吗？此操作不可撤销。
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAll}
                    >
                      确认清空
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  清空所有数据
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
