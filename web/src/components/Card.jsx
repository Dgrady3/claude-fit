import { motion } from 'framer-motion';

export default function Card({ children, className = '', animate = true, padding = 'p-5', ...props }) {
  const Component = animate ? motion.div : 'div';
  const motionProps = animate
    ? { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: 'easeOut' } }
    : {};

  return (
    <Component
      className={`bg-dark-800 border border-dark-600/40 rounded-2xl ${padding} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}
