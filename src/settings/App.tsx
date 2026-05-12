import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import AiApiKeys from "./pages/AiApiKeys";
import EchoWrite from "./pages/EchoWrite";
import EchoWriteAbout from "./pages/echowrite/EchoWriteAbout";
import EchoWriteHistory from "./pages/echowrite/EchoWriteHistory";
import EchoWriteSnippets from "./pages/echowrite/EchoWriteSnippets";
import Notes from "./pages/Notes";
import NotesAll from "./pages/notes/NotesAll";
import NotesAbout from "./pages/notes/NotesAbout";
import Abilities from "./pages/Abilities";
import Activation from "./pages/Activation";
import Settings from "./pages/Settings";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/api-keys" element={<AiApiKeys />} />
            <Route path="/echowrite" element={<EchoWrite />}>
              <Route index element={<Navigate to="history" replace />} />
              <Route path="history" element={<EchoWriteHistory />} />
              <Route path="snippets" element={<EchoWriteSnippets />} />
              <Route path="about" element={<EchoWriteAbout defaultExpanded />} />
            </Route>
            <Route path="/notes" element={<Notes />}>
              <Route index element={<Navigate to="all" replace />} />
              <Route path="all" element={<NotesAll />} />
              <Route path="all/:noteSlug" element={<NotesAll />} />
              <Route path="about" element={<NotesAbout defaultExpanded />} />
              <Route path=":categorySlug" element={<NotesAll />} />
              <Route path=":categorySlug/:noteSlug" element={<NotesAll />} />
            </Route>
            <Route path="/abilities" element={<Abilities />} />
            <Route path="/activation" element={<Activation />} />
            <Route path="/settings/*" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
