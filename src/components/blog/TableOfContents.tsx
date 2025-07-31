'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    // Extract headings from content
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const extractedHeadings: TOCItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      extractedHeadings.push({ id, text, level });
    }

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -70% 0%',
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Table of Contents</h3>
      <ul className="space-y-2">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? 'ml-4' : ''}>
            <button
              onClick={() => scrollToHeading(id)}
              className={`
                text-left w-full text-sm hover:text-blue-600 transition-colors
                ${activeId === id ? 'text-blue-600 font-medium' : 'text-gray-600'}
              `}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
