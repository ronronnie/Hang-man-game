"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  className?: string;
  duration?: number;
  initialValue?: number;
  value: number;
}

export function AnimatedNumber({
  className,
  duration = 0.32,
  initialValue,
  value,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const animatedValue = useMotionValue(initialValue ?? value);
  const [displayValue, setDisplayValue] = useState(initialValue ?? value);

  useMotionValueEvent(animatedValue, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      animatedValue.set(value);
      return;
    }

    const controls = animate(animatedValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [animatedValue, duration, prefersReducedMotion, value]);

  return (
    <motion.span
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {(prefersReducedMotion ? value : displayValue).toLocaleString("en-US")}
    </motion.span>
  );
}
