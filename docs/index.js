/*CMPS3141-HCI - AS2-26S1
Collaborators:
Date: Sept.3.26
*/

import { createApp } from "https://mavue.mavo.io/mavue.js";

createApp({
  data: {
    syntax: "one",
    v1: 30,
    v2: 20,
    v3: 60,
    v4: 40,
    h1: 80,
    h2: 30,
    h3: 60,
    h4: 20,
    r1: 30,
    r2: 70,
    r3: 40,
    r4: 90,
    hCount: 4,
    rCount: 4,
    unit: "px",
    codeInput: "border-radius: 30px;",
    codeError: false,
    copiedMessage: "",
    copied: false,
    showGrid: true,
    showLabels: true,
    activeCorners: [],
    activeAxis: "",
    dragCorner: "",
    dragAxis: "",
    dragPointerId: null
  },

  watch: {
    unit: "syncCode",
    syntax: "syncCode",
    v1: "syncCode",
    v2: "syncCode",
    v3: "syncCode",
    v4: "syncCode",
    h1: "syncCode",
    h2: "syncCode",
    h3: "syncCode",
    h4: "syncCode",
    r1: "syncCode",
    r2: "syncCode",
    r3: "syncCode",
    r4: "syncCode"
  },

  methods: {
    // Select the nearest corner and edge axis before a pointer drag begins.
    startBorderDrag(event) {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const edgeDistance = Math.min(x, y, box.width - x, box.height - y);
      if (edgeDistance > 28) return;

      const corner = `${y <= box.height / 2 ? "T" : "B"}${x <= box.width / 2 ? "L" : "R"}`;
      const horizontalEdgeDistance = Math.min(y, box.height - y);
      const verticalEdgeDistance = Math.min(x, box.width - x);
      const axis = horizontalEdgeDistance <= verticalEdgeDistance ? "horizontal" : "vertical";
      this.dragCorner = corner;
      this.dragAxis = this.syntax === "ellipse" ? axis : "";
      this.dragPointerId = event.pointerId;
      this.activeCorners = [corner];
      this.activeAxis = this.dragAxis;
      event.currentTarget.setPointerCapture(event.pointerId);
    },

    // Convert pointer distance into a px/% radius and update the active syntax value.
    updateBorderDrag(event) {
      if (event.pointerId !== this.dragPointerId) return;
      const box = event.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(box.width, event.clientX - box.left));
      const y = Math.max(0, Math.min(box.height, event.clientY - box.top));
      const cornerX = this.dragCorner.endsWith("L") ? 0 : box.width;
      const cornerY = this.dragCorner.startsWith("T") ? 0 : box.height;
      const pixelValue = this.dragAxis === "vertical" ? Math.abs(y - cornerY) : Math.abs(x - cornerX);
      const dimension = this.dragAxis === "vertical" ? box.height : box.width;
      const value = this.unit === "%" ? (pixelValue / dimension) * 100 : pixelValue;
      const radius = Math.min(150, Math.round(value * 10) / 10);
      const cornerIndex = { TL: 0, TR: 1, BR: 2, BL: 3 }[this.dragCorner];

      if (this.syntax === "ellipse") {
        const property = this.dragAxis === "vertical" ? `r${cornerIndex + 1}` : `h${cornerIndex + 1}`;
        this[property] = radius;
      } else {
        const valueIndex = {
          one: [0, 0, 0, 0],
          two: [0, 1, 0, 1],
          three: [0, 1, 2, 1],
          four: [0, 1, 2, 3]
        }[this.syntax][cornerIndex];
        this[`v${valueIndex + 1}`] = radius;
      }
    },

    endBorderDrag(event) {
      if (event.pointerId !== this.dragPointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      this.dragCorner = "";
      this.dragAxis = "";
      this.dragPointerId = null;
    },

    toggleGrid() {
      this.showGrid = !this.showGrid;
    },

    toggleLabels() {
      this.showLabels = !this.showLabels;
    },

    setActiveCorner(corner) {
      this.activeCorners = [corner];
    },

    setActiveEllipseValue(corner, axis) {
      this.activeCorners = [corner];
      this.activeAxis = axis;
    },

    setActiveValue(valueNumber) {
      const cornerMap = {
        one: { 1: ["TL", "TR", "BR", "BL"] },
        two: { 1: ["TL", "BR"], 2: ["TR", "BL"] },
        three: { 1: ["TL"], 2: ["TR", "BL"], 3: ["BR"] },
        four: { 1: ["TL"], 2: ["TR"], 3: ["BR"], 4: ["BL"] }
      };
      this.activeCorners = cornerMap[this.syntax]?.[valueNumber] || [];
      this.activeAxis = "";
    },

    isActiveCorner(corner) {
      return this.activeCorners.includes(corner);
    },

    getActiveEllipseValue() {
      const values = {
        TL: { horizontal: this.h1, vertical: this.r1 },
        TR: { horizontal: this.h2, vertical: this.r2 },
        BR: { horizontal: this.h3, vertical: this.r3 },
        BL: { horizontal: this.h4, vertical: this.r4 }
      };
      return values[this.activeCorners[0]]?.[this.activeAxis] ?? "";
    },

    syncCode() {
      if (this.hasInvalidRadius()) {
        this.codeError = true;
        return;
      }
      this.codeInput = `border-radius: ${this.getDeclaration()};`;
      this.codeError = false;
    },

    hasInvalidRadius() {
      const values = this.syntax === "ellipse"
        ? [this.h1, this.h2, this.h3, this.h4, this.r1, this.r2, this.r3, this.r4]
        : [this.v1, this.v2, this.v3, this.v4];
      const activeValues = this.syntax === "ellipse"
        ? values.filter((value, index) => index < this.hCount || (index >= 4 && index - 4 < this.rCount))
        : values.slice(0, { one: 1, two: 2, three: 3, four: 4 }[this.syntax]);
      return activeValues.some(value => !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 150);
    },

    radiusValue(value) {
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    },

    // Keep the freeform editor safe by accepting only supported radius values.
    updateFromCode(event) {
      const declaration = event.target.value.trim();
      const match = declaration.match(/^border-radius\s*:\s*(.*?)\s*;?$/i);
      if (!match) {
        this.codeError = true;
        this.activeAxis = "";
        return;
      }

      const groups = match[1].split("/").map(group => group.trim());
      if (groups.length > 2 || groups.some(group => !group || group.split(/\s+/).length > 4)) {
        this.codeError = true;
        this.activeAxis = "";
        return;
      }

      const parsedGroups = groups.map(group => group.split(/\s+/).map(value => value.match(/^(\d+(?:\.\d+)?)(px|%)?$/i)));
      if (parsedGroups.some(group => group.some(value => !value || Number(value[1]) > 150 || (value[2] === undefined && Number(value[1]) !== 0)))) {
        this.codeError = true;
        this.activeAxis = "";
        return;
      }

      const firstGroup = parsedGroups[0];
      const values = firstGroup.map(value => Number(value[1]));
      this.unit = firstGroup.find(value => value[2])?.[2] || "px";
      this.codeError = false;
      this.activeAxis = "";

      if (groups.length === 2) {
        const secondGroup = parsedGroups[1];
        this.syntax = "ellipse";
        this.hCount = firstGroup.length;
        this.rCount = secondGroup.length;
        [this.h1, this.h2, this.h3, this.h4] = [...values, ...values].slice(0, 4);
        const vertical = secondGroup.map(value => Number(value[1]));
        [this.r1, this.r2, this.r3, this.r4] = [...vertical, ...vertical].slice(0, 4);
      } else {
        this.syntax = ["one", "two", "three", "four"][values.length - 1];
        [this.v1, this.v2, this.v3, this.v4] = [...values, ...values].slice(0, 4);
      }
    },

    setSyntax(pattern) {
      if (pattern === "ellipse") {
        [this.h1, this.h2, this.h3, this.h4] = [this.v1, this.v2, this.v3, this.v4];
      } else if (this.syntax === "ellipse") {
        [this.v1, this.v2, this.v3, this.v4] = [this.h1, this.h2, this.h3, this.h4];
      }
      this.syntax = pattern;
    },

    getDeclaration() {
      // CSS repeats shorthand values for omitted corners; ellipse mode has a second axis.
      if (this.syntax === "ellipse") {
        const horizontal = [this.h1, this.h2, this.h3, this.h4].slice(0, this.hCount).map(value => `${this.radiusValue(value)}${this.unit}`).join(" ");
        const vertical = [this.r1, this.r2, this.r3, this.r4].slice(0, this.rCount).map(value => `${this.radiusValue(value)}${this.unit}`).join(" ");
        return `${horizontal} / ${vertical}`;
      }
      const values = [this.v1];
      if (this.syntax === "two" || this.syntax === "three" || this.syntax === "four") values.push(this.v2);
      if (this.syntax === "three" || this.syntax === "four") values.push(this.v3);
      if (this.syntax === "four") values.push(this.v4);
      return values.map(value => `${this.radiusValue(value)}${this.unit}`).join(" ");
    },

    getLonghand() {
      let corners;
      if (this.syntax === "ellipse") {
        const horizontal = [this.h1, this.h2, this.h3, this.h4].slice(0, this.hCount);
        const vertical = [this.r1, this.r2, this.r3, this.r4].slice(0, this.rCount);
        const expand = values => [values[0], values[1] ?? values[0], values[2] ?? values[0], values[3] ?? values[1] ?? values[0]];
        const x = expand(horizontal);
        const y = expand(vertical);
        corners = x.map((value, index) => `${this.radiusValue(value)}${this.unit} ${this.radiusValue(y[index])}${this.unit}`);
      } else {
        const values = [this.v1, this.v2, this.v3, this.v4].slice(0, { one: 1, two: 2, three: 3, four: 4 }[this.syntax]);
        corners = [values[0], values[1] ?? values[0], values[2] ?? values[0], values[3] ?? values[1] ?? values[0]].map(value => `${this.radiusValue(value)}${this.unit}`);
      }
      return `border-top-left-radius: ${corners[0]};\nborder-top-right-radius: ${corners[1]};\nborder-bottom-right-radius: ${corners[2]};\nborder-bottom-left-radius: ${corners[3]};`;
    },

    setCircle() {
      this.unit = "%";
      this.syntax = "one";
      this.v1 = 50;
    },

    setPill() {
      this.unit = "px";
      this.syntax = "two";
      this.v1 = 50;
      this.v2 = 50;
    },

    setBlob() {
      this.unit = "px";
      this.syntax = "four";
      this.v1 = 80;
      this.v2 = 20;
      this.v3 = 60;
      this.v4 = 40;
    },

    reset() {
      this.unit = "px";
      this.syntax = "one";
      this.v1 = this.v2 = this.v3 = this.v4 = 0;
      this.h1 = 80;
      this.h2 = 30;
      this.h3 = 60;
      this.h4 = 20;
      this.r1 = 30;
      this.r2 = 70;
      this.r3 = 40;
      this.r4 = 90;
      this.hCount = 4;
      this.rCount = 4;
      this.activeCorners = [];
      this.activeAxis = "";
      this.codeError = false;
      this.copiedMessage = "";
      this.copied = false;
    },

    copyCSS() {
      if (this.codeError) return;
      const css = this.codeInput;
      navigator.clipboard.writeText(css).then(() => {
        this.copiedMessage = "Copied to clipboard";
        this.copied = true;
        setTimeout(() => (this.copied = false), 1500);
      }).catch(() => {
        this.copiedMessage = "Copy failed; select the CSS manually";
        this.copied = true;
      });
    }
  }
});

if (window.lucide) {
  window.lucide.createIcons();
}

// Remove one grid row above and two below the shape from the square preview.
const previewStage = document.querySelector(".preview-stage");
const previewPanel = document.querySelector(".preview");
if (previewStage && previewPanel) {
  let resizeTimer;
  const resizePreviewStage = () => {
    const isMobile = window.matchMedia("(max-width: 500px)").matches;
    const gridSize = isMobile ? 16 : 24;
    const width = previewStage.getBoundingClientRect().width;
    const height = isMobile
      ? window.innerWidth - 111
      : width - gridSize * 3 - 2;
    previewStage.style.height = `${Math.max(height, gridSize * 10 + 2)}px`;
  };
  const schedulePreviewResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizePreviewStage, 500);
  };
  new ResizeObserver(schedulePreviewResize).observe(previewPanel);
  window.addEventListener("resize", schedulePreviewResize);
  schedulePreviewResize();
  window.setTimeout(resizePreviewStage, 1000);
}

