import type { Transition, Variants } from "framer-motion";

export const quickTransition: Transition = { duration: 0.18, ease: "easeOut" };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: quickTransition },
};
