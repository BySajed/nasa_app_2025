"use client";
import React, { useState } from "react";
import { AddressAutofill } from "@mapbox/search-js-react";
import type { SearchBarProps } from "../interfaces/IMap";
import searchLogo from "../assets/search.svg";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

const SearchBar: React.FC<SearchBarProps> = ({ setCity }) => {
    const [currentSearch, setCurrentSearch] = useState<string>("");

    if (!MAPBOX_ACCESS_TOKEN) {
        console.error("Mapbox access token is not defined");
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCity?.(currentSearch.trim());
        setCurrentSearch("");
    };

    return (
        <div className="p-4 h-16 flex items-center justify-center w-full border-2 border-secondary rounded-full bg-white focus-within:ring-2 focus-within:ring-secondary">
            <div className="flex items-center justify-center w-14 h-12 bg-secondary rounded-full">
                <img src={searchLogo} alt="Search icon" className="w-6 h-6" />
            </div>

            <div className="w-full">
                <form onSubmit={handleSubmit} className="flex items-center justify-between w-full">
                    <AddressAutofill
                        accessToken={MAPBOX_ACCESS_TOKEN!}
                    >
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full h-full px-4 text-neutral focus:outline-none"
                            placeholder="Rechercher votre adresse"
                            value={currentSearch}
                            onChange={(e) => setCurrentSearch(e.target.value)}
                            autoComplete="street-address"
                            name="address-line1"
                        />
                    </AddressAutofill>

                    {currentSearch && (
                        <button type="submit" className="btn btn-secondary cursor-pointer">
                            Valider
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default SearchBar;
