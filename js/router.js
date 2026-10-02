/**
 * KSDAS IT DEL - Client-Side Hash Router
 * Handles hash changes, active view switching, navigation item states,
 * and URL parameter parsing.
 */

class KSDASRouter {
  constructor() {
    this.routes = {
      dashboard: "view-dashboard",
      repository: "view-repository",
      "batch-upload": "view-batch-upload",
      validation: "view-validation",
      relationships: "view-relationships",
      partners: "view-partners",
      activities: "view-activities",
      analytics: "view-analytics",
      accreditation: "view-accreditation",
      reports: "view-reports",
      "nl-query": "view-nl-query",
      audit: "view-audit",
      settings: "view-settings"
    };

    this.currentRoute = "dashboard";
    this.currentParams = {};
    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.handleHashChange());
    window.addEventListener("DOMContentLoaded", () => this.handleHashChange());
  }

  handleHashChange() {
    let hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash) {
      hash = "dashboard";
    }

    // Parse params if any, e.g. #repository?type=PKS_MOA&search=Astra
    const parts = hash.split("?");
    const routeKey = parts[0];
    const queryString = parts[1] || "";

    this.currentParams = this.parseQueryString(queryString);

    if (this.routes[routeKey]) {
      this.navigate(routeKey, this.currentParams, false);
    } else {
      this.navigate("dashboard", {}, false);
    }
  }

  parseQueryString(qs) {
    const params = {};
    if (!qs) return params;
    const pairs = qs.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    }
    return params;
  }

  navigate(routeKey, params = {}, updateHash = true) {
    this.currentRoute = routeKey;
    this.currentParams = params;

    const targetViewId = this.routes[routeKey];
    if (!targetViewId) return;

    // 1. Hide all views
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    // 2. Show active view
    const targetEl = document.getElementById(targetViewId);
    if (targetEl) {
      targetEl.classList.add("active");
    }

    // 3. Update sidebar active links
    document.querySelectorAll(".nav-item").forEach(item => {
      const routeAttr = item.getAttribute("data-route");
      if (routeAttr === routeKey) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // 4. Update hash if needed
    if (updateHash) {
      let hashStr = `#${routeKey}`;
      const queryPairs = [];
      for (const [k, v] of Object.entries(params)) {
        if (v) queryPairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
      }
      if (queryPairs.length > 0) {
        hashStr += `?${queryPairs.join("&")}`;
      }
      window.location.hash = hashStr;
    }

    // 5. Auto-close mobile sidebar drawer on navigation
    const sidebar = document.querySelector(".app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar && sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
      backdrop?.classList.remove("active");
    }

    // 6. Notify view listeners
    if (window.ksdasApp && typeof window.ksdasApp.onViewActivated === "function") {
      window.ksdasApp.onViewActivated(routeKey, params);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getParams() {
    return this.currentParams;
  }
}

// Global router singleton
window.ksdasRouter = new KSDASRouter();
