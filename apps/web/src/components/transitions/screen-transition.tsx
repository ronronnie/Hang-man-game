"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { quickTransition, screenEntrance, transitionItem } from "@/animations/transitions";

interface TransitionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
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

export function TransitionItem({ children, className, delay = 0 }: TransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate="visible"
      className={className}
      initial={reduceMotion ? false : "hidden"}
      transition={{ ...quickTransition, delay }}
      variants={transitionItem}
    >
      {children}
    </motion.div>
  );
}
