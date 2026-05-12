import { Mic, NotebookPen } from "lucide-react";
import Logo from "../../components/Logo";
import MainBackground from "../components/backgrounds/MainBackground";
import CtaButton from "../components/buttons/CtaButton";
import { t } from "../../shared/i18n";
import { useTheme } from "../context/ThemeContext";

export default function Home() {
  const { theme } = useTheme();
  return (
    <MainBackground cssClasses="text-center">
      <div className="mb-10 mt-10">
        <Logo type={theme === "dark" ? "black" : "light"} wClass="w-30" hClass="h-30"></Logo>
      </div>
      <h1 className="text-4xl font-bold text-on-surface">
        {t("homeTaglinePart1")}<br />{t("homeTaglinePart2")}
      </h1>
      <div className="call-to-action flex items-center gap-4 mt-8 justify-center">
        <CtaButton icon={Mic} iconColor="#8b5cf6" toLink="/echowrite">
          {t("pageTitleEchoWrite")}
        </CtaButton>
        <CtaButton icon={NotebookPen} iconColor="#10b981" toLink="/notes">
          {t("pageTitleNotes")}
        </CtaButton>
      </div>
    </MainBackground>
  );
}
