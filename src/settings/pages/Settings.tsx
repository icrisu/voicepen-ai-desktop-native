import { Settings as SettingsIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MainBackground from "../components/backgrounds/MainBackground";
import Card from "../components/Card";
import MicAlert from "../components/MicAlert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import EchoWriteSettings from "../components/EchoWriteSettings";
import OdinSettings from "../components/OdinSettings";
import LanguageSelector from "../components/LanguageSelector";
import { t } from "../../shared/i18n";

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname === "/settings/notes" ? "odin" : "echowrite";

  return (
    <MainBackground>
      <div className="p-5">
        <div className="my-4 w-full md:max-w-2xl md:mx-auto space-y-4">
          <MicAlert />
          <Card title={t("pageTitleSettings")} icon={SettingsIcon} iconColor="#6366f1">
            <div className="space-y-4">
              <LanguageSelector />
              <Tabs value={activeTab} onValueChange={(v) => navigate(v === "odin" ? "/settings/notes" : "/settings/dictate")}>
                <TabsList>
                  <TabsTrigger value="echowrite">{t("pageTitleEchoWrite")}</TabsTrigger>
                  <TabsTrigger value="odin">{t("pageTitleNotes")}</TabsTrigger>
                </TabsList>
                <TabsContent value="echowrite">
                  <EchoWriteSettings />
                </TabsContent>
                <TabsContent value="odin">
                  <OdinSettings />
                </TabsContent>
              </Tabs>
            </div>
          </Card>
          
        </div>
      </div>
    </MainBackground>
  );
}
