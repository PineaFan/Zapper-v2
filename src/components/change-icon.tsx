"use client";
import { motion, AnimatePresence } from "framer-motion";

export function ChangeIcon({
  changeKey,
  children,
  withScale,
}: {
  changeKey: string;
  children: React.ReactNode;
  withScale?: boolean;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={changeKey}
        initial={{ opacity: 0, scale: withScale ? 0.8 : 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: withScale ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
