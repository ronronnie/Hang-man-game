"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { quickTransition, screenEntrance, transitionItem } from "@/animations/transitions";

interface TransitionProps {
  children: ReactNode;
  className?: string;
}

export function ScreenTransition({ children, className }: TransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate="visible"
      className={className}
      initial={reduceMotion ? false : "hidden"}
      variants={screenEntrance}
    >
      {children}
    </motion.div>
  );
}

export function TransitionItem({ children, className }: TransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate="visible"
      className={className}
      initial={reduceMotion ? false : "hidden"}
      transition={quickTransition}
      variants={transitionItem}
    >
      {children}
    </motion.div>
  );
}
