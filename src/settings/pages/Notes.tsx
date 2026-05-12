import { Outlet } from "react-router-dom";
import MainBackground from "../components/backgrounds/MainBackground";

export default function Notes() {
  return (
    <MainBackground>
      <div className="p-5">
        <Outlet />
      </div>
    </MainBackground>
  );
}
