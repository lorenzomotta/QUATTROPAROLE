import React, { useState, useEffect, useRef, useCallback } from 'react';

const PAGE_HEIGHT = 400;
const TEXT_CLASS = 'text-base sm:text-lg text-gray-800 leading-relaxed font-medium';

interface StoryPagerProps {
  text: string;
  loading: boolean;
  emptyMessage: string;
}

function paginateByHeight(measureEl: HTMLElement, text: string, maxHeight: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/);
  const pages: string[] = [];
  let currentWords: string[] = [];

  for (const word of words) {
    const candidate = [...currentWords, word].join(' ');
    measureEl.textContent = candidate;

    if (measureEl.scrollHeight > maxHeight && currentWords.length > 0) {
      pages.push(currentWords.join(' '));
      currentWords = [word];
    } else {
      currentWords.push(word);
    }
  }

  if (currentWords.length > 0) {
    pages.push(currentWords.join(' '));
  }

  return pages;
}

const StoryPager: React.FC<StoryPagerProps> = ({ text, loading, emptyMessage }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const prevTextRef = useRef(text);

  const recalculatePages = useCallback(() => {
    if (!measureRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    measureRef.current.style.width = `${width}px`;

    if (!text.trim()) {
      setPages([]);
      setCurrentPage(0);
      prevTextRef.current = text;
      return;
    }

    const newPages = paginateByHeight(measureRef.current, text, PAGE_HEIGHT);
    setPages(newPages);

    const textGrew = text.length > prevTextRef.current.length;
    prevTextRef.current = text;

    setCurrentPage((prev) => {
      if (textGrew && newPages.length > 0) {
        return newPages.length - 1;
      }
      if (prev >= newPages.length) {
        return Math.max(0, newPages.length - 1);
      }
      return prev;
    });
  }, [text]);

  useEffect(() => {
    recalculatePages();
  }, [recalculatePages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => recalculatePages());
    observer.observe(container);
    return () => observer.disconnect();
  }, [recalculatePages]);

  const goPrev = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(pages.length - 1, p + 1));

  const hasPages = pages.length > 0;
  const canGoPrev = hasPages && currentPage > 0;
  const canGoNext = hasPages && currentPage < pages.length - 1;

  return (
    <div>
      <div
        ref={containerRef}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 overflow-hidden relative"
      >
        <div
          ref={measureRef}
          aria-hidden
          className={`${TEXT_CLASS} p-6`}
          style={{ position: 'fixed', left: '-9999px', top: 0, visibility: 'hidden', pointerEvents: 'none' }}
        />

        <div className="h-[400px] overflow-hidden">
          {loading ? (
            <div className={`p-6 h-full ${TEXT_CLASS}`}>
              <span className="text-gray-400 italic">Caricamento...</span>
            </div>
          ) : !hasPages ? (
            <div className={`p-6 h-full ${TEXT_CLASS}`}>
              <span className="text-gray-400 italic">{emptyMessage}</span>
            </div>
          ) : (
            <div
              className="flex h-full transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((page, index) => (
                <div
                  key={index}
                  className={`min-w-full w-full flex-shrink-0 p-6 ${TEXT_CLASS}`}
                  style={{ height: PAGE_HEIGHT }}
                >
                  {page}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && hasPages && (
        <div className="flex items-center justify-between mt-3 gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label="Pagina precedente"
            className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors touch-manipulation shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-sm font-semibold text-gray-600 tabular-nums">
            Pagina {currentPage + 1} di {pages.length}
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            aria-label="Pagina successiva"
            className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors touch-manipulation shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryPager;
