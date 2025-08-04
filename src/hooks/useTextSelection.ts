import { useState, useCallback, useRef, useEffect } from 'react';

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  elementId: string;
  context: SelectionContext;
  boundingRect: DOMRect;
  timestamp: Date;
}

export interface SelectionContext {
  contentType: 'risk' | 'control' | 'test-script' | 'document' | 'text';
  contentId: string;
  sectionType?: string;
  metadata?: Record<string, unknown>;
}

interface UseTextSelectionOptions {
  enabled?: boolean;
  minLength?: number;
  maxLength?: number;
  debounceMs?: number;
  persistSelection?: boolean;
}

export function useTextSelection(
  containerRef: React.RefObject<HTMLElement>,
  context: SelectionContext,
  options: UseTextSelectionOptions = {}
) {
  const {
    enabled = true,
    minLength = 3,
    maxLength = 2000,
    debounceMs = 300,
    persistSelection = false,
  } = options;

  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionHistory, setSelectionHistory] = useState<TextSelection[]>([]);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Generate unique element ID for selection tracking
  const generateElementId = useCallback((element: Element): string => {
    return element.id || `selection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, []);

  // Get text selection with precise positioning
  const getSelectionInfo = useCallback((): TextSelection | null => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !containerRef.current) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (selectedText.length < minLength || selectedText.length > maxLength) {
      return null;
    }

    // Check if selection is within our container
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      return null
    }

    const boundingRect = range.getBoundingClientRect();
    const elementId = generateElementId(
      range.commonAncestorContainer.parentElement || (range.commonAncestorContainer as Element)
    );

    return {
      text: selectedText,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      elementId,
      context,
      boundingRect,
      timestamp: new Date(),
    }
  }, [containerRef, context, minLength, maxLength, generateElementId]);

  // Handle selection change with debouncing
  const handleSelectionChange = useCallback(() => {
    if (!enabled) return

    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    selectionTimeoutRef.current = setTimeout(() => {
      const selectionInfo = getSelectionInfo();

      if (selectionInfo) {
        setCurrentSelection(selectionInfo);

        if (persistSelection) {
          setSelectionHistory((prev) => [...prev.slice(-9), selectionInfo]);
        }
      } else {
        if (!persistSelection) {
          setCurrentSelection(null);
        }
      }

      setIsSelecting(false);
    }, debounceMs);
  }, [enabled, getSelectionInfo, persistSelection, debounceMs]);

  // Mouse event handlers
  const handleMouseDown = useCallback(() => {
    if (!enabled) return
    setIsSelecting(true);
  }, [enabled]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;
    handleSelectionChange();
  }, [enabled, handleSelectionChange]);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return

      const touch = event.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      setIsSelecting(true);
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;

      const touch = event.changedTouches[0];
      const distance = Math.sqrt(
        Math.pow(touch.clientX - touchStartRef.current.x, 2) +
          Math.pow(touch.clientY - touchStartRef.current.y, 2)
      );

      // Only trigger selection if touch moved significantly (long press behavior)
      if (distance < 10) {
        setTimeout(handleSelectionChange, 100)
      } else {
        handleSelectionChange();
      }

      touchStartRef.current = null;
    },
    [enabled, handleSelectionChange]
  );

  // Keyboard selection support
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Handle Shift + Arrow keys for keyboard selection
      if (
        event.shiftKey &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        setIsSelecting(true)
        setTimeout(handleSelectionChange, 50);
      }

      // Handle Escape to clear selection
      if (event.key === 'Escape') {
        clearSelection()
      }
    },
    [enabled, handleSelectionChange]
  );

  // Clear current selection
  const clearSelection = useCallback(() => {
    setCurrentSelection(null)
    setIsSelecting(false);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, []);

  // Clear selection history
  const clearHistory = useCallback(() => {
    setSelectionHistory([])
  }, []);

  // Get selection by index from history
  const getHistorySelection = useCallback(
    (_index: number): TextSelection | null => {
      return selectionHistory[index] || null
    },
    [selectionHistory]
  );

  // Restore a previous selection
  const restoreSelection = useCallback((selection: TextSelection) => {
    setCurrentSelection(selection)

    // Try to restore the actual DOM selection (best effort)
    try {
      const element = document.getElementById(selection.elementId)
      if (element) {
        const range = document.createRange();
        const textNode = element.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          range.setStart(
            textNode,
            Math.min(selection.startOffset, textNode.textContent?.length || 0)
          );
          range.setEnd(textNode, Math.min(selection.endOffset, textNode.textContent?.length || 0));

          const windowSelection = window.getSelection();
          if (windowSelection) {
            windowSelection.removeAllRanges();
            windowSelection.addRange(range);
          }
        }
      }
    } catch (error) {
      // console.warn('Could not restore DOM selection:', error)
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return;

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp);

    // Touch events
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd);

    // Keyboard events
    container.addEventListener('keydown', handleKeyDown)

    // Selection change event
    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectionchange', handleSelectionChange);

      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    }
  }, [
    enabled,
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
    handleSelectionChange,
  ]);

  return {
    currentSelection,
    isSelecting,
    selectionHistory,
    clearSelection,
    clearHistory,
    getHistorySelection,
    restoreSelection,
    hasSelection: currentSelection !== null,
    historyCount: selectionHistory.length,
  }
}
