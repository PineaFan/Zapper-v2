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

export function ChangeText({
  changeKey,
  children,
}: {
  changeKey?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={changeKey || (children as string) || "static"}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        style={{ display: "inline-block" }}
      >
        <motion.span
          layout
          transition={{ duration: 0.2 }}
          style={{ display: "inline-block" }}
        >
          {children}
        </motion.span>
      </motion.span>
    </AnimatePresence>
  );
}
