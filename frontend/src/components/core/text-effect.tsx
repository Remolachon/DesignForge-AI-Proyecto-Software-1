'use client';
import { cn } from '@/lib/utils/cn';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import React from 'react';

export type PresetType = 'blur' | 'fade-in-blur' | 'scale' | 'fade' | 'slide';
export type PerType = 'word' | 'char' | 'line';

export type TextEffectProps = {
  children: string;
  per?: PerType;
  as?: keyof React.JSX.IntrinsicElements;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  className?: string;
  preset?: PresetType;
  delay?: number;
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
};

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(12px)' },
      visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.4 } },
    },
  },
  'fade-in-blur': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20, filter: 'blur(12px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3 } },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    },
  },
};

export function TextEffect({
  children,
  per = 'word',
  as = 'div',
  variants,
  className,
  preset,
  delay = 0,
}: TextEffectProps) {
  const MotionTag = motion[as as keyof typeof motion] as any;
  const selectedVariants = preset ? presetVariants[preset] : null;

  const containerVariants = variants?.container || selectedVariants?.container || defaultContainerVariants;
  const itemVariants = variants?.item || selectedVariants?.item || defaultItemVariants;

  if (delay > 0) {
    if (containerVariants.visible && typeof containerVariants.visible === 'object') {
      const v = containerVariants.visible as any;
      containerVariants.visible = {
        ...v,
        transition: {
          ...v.transition,
          delayChildren: delay,
        }
      };
    }
  }

  const renderContent = () => {
    if (per === 'word') {
      return children.split(/(\s+)/).map((segment, index) => (
        <motion.span
          key={`word-${index}`}
          variants={itemVariants}
          className="inline-block"
        >
          {segment}
        </motion.span>
      ));
    } else if (per === 'char') {
      const words = children.split(/(\s+)/);
      let charIndex = 0;
      return words.map((word, wordIndex) => {
        if (word.match(/^\s+$/)) {
          return (
            <span key={`space-${wordIndex}`} className="inline-block whitespace-pre">
              {word}
            </span>
          );
        }
        return (
          <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
            {word.split('').map((char) => {
              const currentIdx = charIndex++;
              return (
                <motion.span
                  key={`char-${currentIdx}`}
                  variants={itemVariants}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              );
            })}
          </span>
        );
      });
    } else if (per === 'line') {
      return children.split('\n').map((segment, index) => (
        <motion.span
          key={`line-${index}`}
          variants={itemVariants}
          className="inline-block"
        >
          {segment}
        </motion.span>
      ));
    }
  };

  return (
    <AnimatePresence>
      <MotionTag
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={containerVariants}
        className={cn("whitespace-pre-wrap", className)}
      >
        {renderContent()}
      </MotionTag>
    </AnimatePresence>
  );
}
