import React from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function AttemptsSelection({ attempts, onSelectAttempt, maxAttempts = 20 }) {
  return (
    <Card>
      <h2 className="font-semibold mb-2">Attempts</h2>
      <div className="flex gap-2 flex-wrap">
        {[...Array(maxAttempts).keys()].map((i) => {
          const attemptNum = i + 1;
          return (
            <Button
              key={attemptNum}
              className={`w-10 h-10 rounded-lg ${
                attempts === attemptNum
                  ? "bg-yellow-500 text-white shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => onSelectAttempt(attemptNum)}
            >
              {attemptNum}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
