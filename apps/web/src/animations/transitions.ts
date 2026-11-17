import type { Transition, Variants } from "framer-motion";

export const quickTransition: Transition = { duration: 0.18, ease: "easeOut" };

export const screenTransition: Transition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: quickTransition },
};

export const screenEntrance: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...screenTransition, staggerChildren: 0.045 },
  },
};

export const transitionItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
