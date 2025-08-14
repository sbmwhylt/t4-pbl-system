import Button from "../ui/Button";
import Card from "../ui/Card";

export default function BoulderSelection({ currentBoulder, onSelectBoulder }) {
  const boulders = ["A", "B", "C", "D"];

  return (
    <Card >
      <h2 className="font-semibold mb-2">Boulders</h2>
      <div className="flex gap-2">
        {boulders.map((boulder) => (
          <Button
            key={boulder}
            className={`w-16 h-16 text-lg rounded-lg ${
              currentBoulder === boulder
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => onSelectBoulder(boulder)}
          >
            {boulder}
          </Button>
        ))}
      </div>
    </Card>
  );
}
