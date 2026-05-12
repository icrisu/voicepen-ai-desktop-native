import MainBackground from "../components/backgrounds/MainBackground";
import AlertBanner from "../components/AlertBanner";
import MicAlert from "../components/MicAlert";
import EchoWriteAbout from "./echowrite/EchoWriteAbout";
import NotesAbout from "./notes/NotesAbout";

export default function Abilities() {
  return (
    <MainBackground>
      <div className="p-5">
        <div className="my-4 w-full md:max-w-2xl md:mx-auto space-y-4">
          <MicAlert />
          <AlertBanner type="info">
            <p className="text-sm">
              <span className="font-semibold">Abilities</span> are features VoicePen can use on your behalf while you browse. Each ability below describes what it does and how you can activate or instruct it — either by speaking (Dictate) or by asking VoicePen directly in chat (Notes).
            </p>
          </AlertBanner>
        </div>
        <EchoWriteAbout />
        <NotesAbout />
      </div>
    </MainBackground>
  );
}
