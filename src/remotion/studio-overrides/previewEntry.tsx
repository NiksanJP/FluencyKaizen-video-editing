/**
 * Custom Remotion Studio preview entry.
 * Imports the original studio and applies FluencyKaizen customizations:
 * - Compositions tab removed at source (ExplorerPanel.tsx in remotion-upstream)
 * - Add "Back to Home" button in menubar
 */
// Use relative path (remotion/studio-overrides -> remotion -> root/node_modules)
import "../../../node_modules/@remotion/studio/dist/esm/previewEntry.mjs";

// Apply customizations after the studio has loaded
function applyFluencyKaizenCustomizations() {
  let backBtnInjected = false;

  const observer = new MutationObserver(() => {
    // Inject "Back to Home" button into the top menubar (skip if already in DOM from MenuToolbar)
    if (!backBtnInjected && !document.getElementById("fk-back-home")) {
      let menubar =
        document.querySelector("[role='menubar']") ||
        document.querySelector(".css-reset > div > div > div");

      if (!menubar) {
        const allDivs = document.querySelectorAll(".css-reset div");
        for (let j = 0; j < allDivs.length; j++) {
          const d = allDivs[j];
          if (
            d.querySelector('a[href*="remotion"]') ||
            d.querySelector('img[alt*="Remotion"]')
          ) {
            menubar = d.parentElement;
            break;
          }
        }
      }

      if (menubar) {
        const btn = document.createElement("button");
        btn.id = "fk-back-home";
        btn.title = "Back to Home";
        btn.style.cssText = `
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          margin-right: 8px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 4px;
          color: #ccc;
          font-size: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        `;
        btn.onmouseover = () => {
          btn.style.background = "rgba(255,255,255,0.08)";
          btn.style.color = "#fff";
          btn.style.borderColor = "rgba(255,255,255,0.3)";
        };
        btn.onmouseout = () => {
          btn.style.background = "transparent";
          btn.style.color = "#ccc";
          btn.style.borderColor = "rgba(255,255,255,0.15)";
        };

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.style.width = "14px";
        svg.style.height = "14px";
        svg.style.fill = "currentColor";
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute(
          "d",
          "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
        );
        svg.appendChild(path);
        btn.appendChild(svg);
        btn.appendChild(document.createTextNode(" Home"));

        btn.addEventListener("click", () => {
          if ((window as any).studio?.goBack) {
            (window as any).studio.goBack();
          } else if (window.parent !== window) {
            window.parent.postMessage({ type: "go-home" }, "*");
          } else {
            window.location.href = "/";
          }
        });

        menubar.insertBefore(btn, menubar.firstChild);
        backBtnInjected = true;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  hideCompositionsTab();
}

// Run when DOM is ready (studio loads asynchronously)
if (typeof window !== "undefined") {
  if (document.body) {
    applyFluencyKaizenCustomizations();
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      applyFluencyKaizenCustomizations();
    });
  }
}
