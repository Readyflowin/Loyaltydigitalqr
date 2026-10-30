import React, { useState, useEffect, useCallback } from 'react';
import { RouterContext, useRouter } from './RouterContext';

interface RouterProviderProps {
  children: React.ReactNode;
}

const getNormalizedPath = (path: string): string => {
  const [pathname] = path.split('?');
  if (pathname.toLowerCase() === '/india' && pathname !== '/india') {
    return '/india';
  }
  return pathname || '/';
};

export const RouterProvider: React.FC<RouterProviderProps> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return getNormalizedPath(window.location.pathname);
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  });

  // Handle case redirect for /India -> /india in the browser URL bar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.toLowerCase() === '/india' && pathname !== '/india') {
        const newUrl = '/india' + window.location.search + window.location.hash;
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, []);

  // Listen to popstate (back / forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const normalized = getNormalizedPath(window.location.pathname);
      setCurrentPath(normalized);
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    // Handle hash links if targeting same page anchor
    if (to.startsWith('#')) {
      const element = document.getElementById(to.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const [targetPath, queryString] = to.split('?');
    const normalizedTarget = getNormalizedPath(targetPath);
    const fullTarget = normalizedTarget + (queryString ? `?${queryString}` : '');

    if (options?.replace) {
      window.history.replaceState(null, '', fullTarget);
    } else {
      window.history.pushState(null, '', fullTarget);
    }

    setCurrentPath(normalizedTarget);
    setSearchParams(new URLSearchParams(queryString || ''));

    // Check if navigating to hash on target page
    const hashIndex = to.indexOf('#');
    if (hashIndex !== -1) {
      const hash = to.substring(hashIndex + 1);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, searchParams, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  replace?: boolean;
}

export const Link: React.FC<LinkProps> = ({
  href,
  replace = false,
  children,
  onClick,
  ...rest
}) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    // Let browser handle external links, open in new tab, or special clicks
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      rest.target === '_blank' ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return;
    }

    e.preventDefault();
    navigate(href, { replace });
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
