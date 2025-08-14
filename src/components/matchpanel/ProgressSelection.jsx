import React from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";

const PROGRESS_STAGES = ["No Points", "Z1", "Z2", "Top"];

export default function ProgressSelection({ progress, onSelectProgress }) {
  return (
    <Card>
      <h2 className="font-semibold mb-2">Progress</h2>
      <div className="flex gap-2">
        {PROGRESS_STAGES.map((stage) => (
          <Button
            key={stage}
            className={`px-4 py-2 rounded-lg ${
              progress === stage
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => onSelectProgress(stage)}
          >
            {stage}
          </Button>
        ))}
      </div>
    </Card>
  );
}
