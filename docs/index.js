/*CMPS3141-HCI - AS2-26S1
Collaborators:
Date: Sept.3.26
*/

import { createApp } from "https://mavue.mavo.io/mavue.js";

createApp({
  data: {
    syntax: "four",
    v1: 80,
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
    codeInput: "border-radius: 80px 20px 60px 40px;",
    codeError: false,
    copiedMessage: "",
    copied: false,
    showGrid: true,
    activeCorners: []
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
    toggleGrid() {
      this.showGrid = !this.showGrid;
    },

    setActiveCorner(corner) {
      this.activeCorners = [corner];
    },

    setActiveValue(valueNumber) {
      const cornerMap = {
        one: { 1: ["TL", "TR", "BR", "BL"] },
        two: { 1: ["TL", "BR"], 2: ["TR", "BL"] },
        three: { 1: ["TL"], 2: ["TR", "BL"], 3: ["BR"] },
        four: { 1: ["TL"], 2: ["TR"], 3: ["BR"], 4: ["BL"] }
      };
      this.activeCorners = cornerMap[this.syntax]?.[valueNumber] || [];
    },

    isActiveCorner(corner) {
      return this.activeCorners.includes(corner);
    },

    syncCode() {
      this.codeInput = `border-radius: ${this.getDeclaration()};`;
      this.codeError = false;
    },

    updateFromCode(event) {
      const declaration = event.target.value.trim();
      const match = declaration.match(/^border-radius\s*:\s*(.*?)\s*;?$/i);
      if (!match) {
        this.codeError = true;
        return;
      }

      const groups = match[1].split("/").map(group => group.trim());
      if (groups.length > 2 || groups.some(group => !group || group.split(/\s+/).length > 4)) {
        this.codeError = true;
        return;
      }

      const parsedGroups = groups.map(group => group.split(/\s+/).map(value => value.match(/^(\d+(?:\.\d+)?)(px|%)$/i)));
      if (parsedGroups.some(group => group.some(value => !value))) {
        this.codeError = true;
        return;
      }

      const firstGroup = parsedGroups[0];
      const values = firstGroup.map(value => Number(value[1]));
      this.unit = firstGroup[0][2];
      this.codeError = false;

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
      this.syntax = pattern;
    },

    getDeclaration() {
      if (this.syntax === "ellipse") {
        const horizontal = [this.h1, this.h2, this.h3, this.h4].slice(0, this.hCount).map(value => `${value}${this.unit}`).join(" ");
        const vertical = [this.r1, this.r2, this.r3, this.r4].slice(0, this.rCount).map(value => `${value}${this.unit}`).join(" ");
        return `${horizontal} / ${vertical}`;
      }
      const values = [this.v1];
      if (this.syntax === "two" || this.syntax === "three" || this.syntax === "four") values.push(this.v2);
      if (this.syntax === "three" || this.syntax === "four") values.push(this.v3);
      if (this.syntax === "four") values.push(this.v4);
      return values.map(value => `${value}${this.unit}`).join(" ");
    },

    getLonghand() {
      let corners;
      if (this.syntax === "ellipse") {
        const horizontal = [this.h1, this.h2, this.h3, this.h4].slice(0, this.hCount);
        const vertical = [this.r1, this.r2, this.r3, this.r4].slice(0, this.rCount);
        const expand = values => [values[0], values[1] ?? values[0], values[2] ?? values[0], values[3] ?? values[1] ?? values[0]];
        const x = expand(horizontal);
        const y = expand(vertical);
        corners = x.map((value, index) => `${value}${this.unit} ${y[index]}${this.unit}`);
      } else {
        const values = [this.v1, this.v2, this.v3, this.v4].slice(0, { one: 1, two: 2, three: 3, four: 4 }[this.syntax]);
        corners = [values[0], values[1] ?? values[0], values[2] ?? values[0], values[3] ?? values[1] ?? values[0]].map(value => `${value}${this.unit}`);
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
    },

    copyCSS() {
      const css = this.codeInput;
      navigator.clipboard.writeText(css);
      this.copiedMessage = "Copied to clipboard";
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    }
  }
});
