import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Lightbulb, FlaskConical } from "lucide-react";

interface TabSwitchProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function TabSwitch({ activeTab, onTabChange }: TabSwitchProps) {
  return (
    <div className="fixed top-14 sm:top-20 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-sky-100 px-2 sm:px-6 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="bg-sky-50 p-1 rounded-xl w-full max-w-xl mx-auto grid grid-cols-3 h-10 sm:h-12">
            <TabsTrigger
              value="opportunities"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-light data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm px-1 sm:px-3"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">机会列表</span>
              <span className="xs:hidden sm:hidden">机会</span>
            </TabsTrigger>
            <TabsTrigger
              value="principles"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-pink-400 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm px-1 sm:px-3"
            >
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">投资理念</span>
              <span className="xs:hidden sm:hidden">理念</span>
            </TabsTrigger>
            <TabsTrigger
              value="methodology"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm px-1 sm:px-3"
            >
              <FlaskConical className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">方法论</span>
              <span className="xs:hidden sm:hidden">方法</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
