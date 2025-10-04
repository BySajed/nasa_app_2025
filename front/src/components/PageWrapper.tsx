import {motion} from "framer-motion";
import type {PropsWithChildren} from "react";

const variants = {
    initial: {opacity: 0, y: 12, filter: "blur(2px)"},
    animate: {opacity: 1, y: 0, filter: "blur(0px)"},
    exit: {opacity: 0, y: -12, filter: "blur(2px)"},
};

export default function PageWrapper({children}: PropsWithChildren) {
    return (
        <motion.main
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{duration: 0.25, ease: "easeOut"}}
            style={{minHeight: "100vh"}}
        >
            {children}
        </motion.main>
    );
}
