import { useEffect } from "react";
import ScoreBar from "../../components/scoreboard/ScoreBar";

export default function LiveView() {
  useEffect(() => {
    document.title = "Scoreboard - Live View";
  }, []);

  return (
    <div className="flex flex-col justify-end items-center min-h-screen bg-transparent text-center pb-8">
      <ScoreBar/>
    </div>
  );
}
