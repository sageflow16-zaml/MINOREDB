import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.matchMedia for framer-motion and useReducedMotion
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill missing DOM APIs for jsdom (required by Radix UI)
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: "div",
      span: "span",
      p: "p",
      button: "button",
      section: "section",
      article: "article",
      aside: "aside",
      header: "header",
      footer: "footer",
      main: "main",
      nav: "nav",
      ul: "ul",
      ol: "ol",
      li: "li",
      form: "form",
      label: "label",
      input: "input",
      textarea: "textarea",
      select: "select",
      img: "img",
      svg: "svg",
      path: "path",
      circle: "circle",
      rect: "rect",
      line: "line",
      g: "g",
      h1: "h1",
      h2: "h2",
      h3: "h3",
      h4: "h4",
      h5: "h5",
      h6: "h6",
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});
