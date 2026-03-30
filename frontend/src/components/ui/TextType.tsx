"use client";

import {
  ElementType,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { gsap } from "gsap";

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string | React.ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

function TextType({
  text,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = "",
  showCursor = true,
  hideCursorWhileTyping = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cursorCharacter = "|",
  cursorClassName = "",
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const textArray = useMemo(
    () => (Array.isArray(text) ? text : [text]),
    [text],
  );

  const getRandomSpeed = useCallback(
    (isDeleting: boolean) => {
      const baseSpeed = isDeleting ? deletingSpeed : typingSpeed;
      if (!variableSpeed) {
        // Natural variation: ±20%
        return baseSpeed * (0.8 + Math.random() * 0.4);
      }
      const { min, max } = variableSpeed;
      return Math.random() * (max - min) + min;
    },
    [variableSpeed, typingSpeed, deletingSpeed],
  );

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return;
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!showCursor || !cursorRef.current) return;

    const cursor = cursorRef.current;

    gsap.fromTo(
      cursor,
      { opacity: 0, scaleY: 0.7, transformOrigin: "center" },
      {
        opacity: 1,
        scaleY: 1,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      },
    );

    return () => {
      gsap.killTweensOf(cursor);
    };
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: NodeJS.Timeout;

    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode
      ? currentText.split("").reverse().join("")
      : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === "") {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          if (onSentenceComplete) {
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          }

          const nextIndex = (currentTextIndex + 1) % textArray.length;
          setCurrentTextIndex(nextIndex);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration / 2);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, getRandomSpeed(true));
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev + processedText[currentCharIndex]);
            setCurrentCharIndex((prev) => prev + 1);
          }, getRandomSpeed(false));
        } else if (loop || textArray.length > 1) {
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    getRandomSpeed,
    onSentenceComplete,
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  const content = (
    <>
      <span
        className="inline"
        style={{ color: getCurrentTextColor() || "inherit" }}
      >
        {displayedText}
      </span>
      {showCursor && (
        <span
          ref={cursorRef}
          className={`ml-1 inline-block w-[2px] h-[1.1em] translate-y-[0.1em] align-middle bg-current rounded-full opacity-100 ${
            shouldHideCursor ? "hidden" : ""
          } ${cursorClassName}`}
        />
      )}
    </>
  );

  const Tag = Component as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
  >;

  return (
    <Tag
      ref={containerRef as React.Ref<HTMLElement>}
      className={`inline-block whitespace-pre-wrap tracking-tight ${className}`}
      {...props}
    >
      {content}
    </Tag>
  );
}

export default TextType;
