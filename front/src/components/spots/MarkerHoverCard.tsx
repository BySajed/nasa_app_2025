import type { SpotRead } from "../../interfaces/ISpotRead";

const MarkerHoverCard = (spot: SpotRead) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <img
          src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${spot.owner.username}`}
          className="w-8 h-8 rounded-full"
        />
        <h3 className="text-black font-bold text-md">{spot.owner.username}</h3>
      </div>
      <span className="text-neutral-400 text-[8px] italic">
        {new Date(spot.created_at).toLocaleString()}
      </span>
    </div>
  );
};

export default MarkerHoverCard;
