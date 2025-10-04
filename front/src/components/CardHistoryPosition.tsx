import React from 'react';
import type {Position} from "../interfaces/IPosition.ts";

interface CardHistoryPositionProps extends Position {
    onClick?: () => void;
}

const CardHistoryPosition: React.FC<CardHistoryPositionProps> = (pos) => (
    <div
        className="card bg-base-100 shadow-sm cursor-pointer border border-transparent hover:border hover:border-secondary transition-all duration-150"
        onClick={pos.onClick}>
        <div className="card-body p-3">
            <h3 className="card-title text-sm">
                {pos.title || `Position ${pos.id.slice(0, 8)}`}
            </h3>
            <p className="text-xs opacity-70">
                {pos.description || 'Position visited previously'}
            </p>
            <div className="text-xs font-mono opacity-60">
                {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
            </div>
            <div className="text-xs opacity-50">
                {new Date(pos.timestamp).toLocaleString()}
            </div>
        </div>
    </div>
);

export default CardHistoryPosition;
