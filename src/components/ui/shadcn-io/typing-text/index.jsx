'use client';
import { useEffect, useRef, useState, createElement, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';

const TypingText = ({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  animationStartTime = 0,
  animationEndTime = 2,
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef(null);
  const containerRef = useRef(null);

  const textArray = useMemo(() => {
    if (Array.isArray(text)) {
      return text.filter(item => typeof item === 'string');
    }
    if (typeof text === 'string') {
      return [text];
    }
    return [''];
  }, [text]);

  // Use deterministic random for consistent timing with export
  const getRandomSpeed = useCallback((charIndex) => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    
    // Use the same deterministic seed logic as export
    const seed = text && typeof text === 'string' ? text.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
    const seededRandom = (index) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    const randomFactor = seededRandom(charIndex);
    return min + (randomFactor * (max - min));
  }, [variableSpeed, typingSpeed, text]);

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentCharIndex(0);
    setIsDeleting(false);
    setCurrentTextIndex(0);
  }, [text]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return 'currentColor';
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout;

    const currentText = textArray[currentTextIndex];
    const processedText = currentText && typeof currentText === 'string' 
      ? (reverseMode ? currentText.split('').reverse().join('') : currentText)
      : '';

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          if (onSentenceComplete) {
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          }

          setCurrentTextIndex(prev => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev + processedText[currentCharIndex]);
            setCurrentCharIndex(prev => prev + 1);
          }, variableSpeed ? getRandomSpeed(currentCharIndex) : typingSpeed);
        } else if (textArray.length > 1 || loop) {
          // Start deleting after pause for multi-text arrays or when looping is enabled
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
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
    onSentenceComplete,
    getRandomSpeed
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < (textArray[currentTextIndex]?.length || 0) || isDeleting);

  return createElement(Component, {
    ref: containerRef,
    className: `inline-block whitespace-pre-wrap tracking-tight ${className}`,
    ...props
  }, <span className="inline" style={{ color: getCurrentTextColor() }}>
    {displayedText}
  </span>, showCursor && (
    <span
      ref={cursorRef}
      className={`inline-block opacity-100 ${shouldHideCursor ? 'hidden' : ''} ${
        cursorCharacter === '|' 
          ? `h-5 w-[1px] translate-y-1 bg-foreground ${cursorClassName}` 
          : `ml-1 ${cursorClassName}`
      }`}>
      {cursorCharacter === '|' ? '' : cursorCharacter}
    </span>
  ));
};

export default TypingText;