// src/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Sky from "./pages/Sky";
import PageWrapper from "./components/PageWrapper.tsx";

function RoutesWithTransitions() {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, [location.pathname]);

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/sky" element={<PageWrapper><Sky /></PageWrapper>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <RoutesWithTransitions />
        </BrowserRouter>
    );
}
