import { describe, it, expect } from "vitest";
import { createAlerts, HIGH_DEMAND_THRESHOLD } from "./managerHelpers";

const t = {
  outOfStockTitle: "Out of stock",
  lowStockTitle: "Low stock",
  lowStockMsg: "{name} down to {stock}",
  highDemandTitle: "High demand",
  highDemandMsg: "{name} has {count} requests",
  customSizeTitle: "Custom size",
  customSizeMsg: "{orderId} {name} {size}",
  overdueShippingTitle: "Delayed",
  overdueShippingMsg: "{orderId}",
};

const product = (code, stock, minStock = 10) => ({
  code,
  name: code,
  stock,
  minStock,
});

const requests = (code, count) =>
  Array.from({ length: count }, () => ({ productCode: code }));

const keysOf = (alerts) => alerts.map((a) => a.key);

describe("createAlerts — stock alerts", () => {
  it("raises an out-of-stock alert", () => {
    const alerts = createAlerts([product("FS-1", 0)], [], t);
    expect(keysOf(alerts)).toContain("oos_FS-1");
  });

  it("raises a low-stock alert", () => {
    const alerts = createAlerts([product("FS-1", 3)], [], t);
    expect(keysOf(alerts)).toContain("low_FS-1");
  });

  it("raises neither for a well-stocked product", () => {
    expect(createAlerts([product("FS-1", 50)], [], t)).toHaveLength(0);
  });
});

describe("createAlerts — the manager's preferences are honoured", () => {
  // The settings panel showed a saved confirmation while storing nothing, so
  // these switches had no effect at all.
  it("suppresses out-of-stock alerts when switched off", () => {
    const alerts = createAlerts([product("FS-1", 0)], [], t, "he", [], {
      outOfStock: false,
    });

    expect(keysOf(alerts)).not.toContain("oos_FS-1");
  });

  it("suppresses low-stock alerts when switched off", () => {
    const alerts = createAlerts([product("FS-1", 3)], [], t, "he", [], {
      lowStock: false,
    });

    expect(keysOf(alerts)).not.toContain("low_FS-1");
  });

  it("suppresses demand alerts when switched off", () => {
    const alerts = createAlerts(
      [product("FS-1", 0)],
      [],
      t,
      "he",
      requests("FS-1", 40),
      { highDemand: false, outOfStock: false },
    );

    expect(keysOf(alerts)).not.toContain("demand_FS-1");
  });

  it("keeps every alert on when no preferences are supplied", () => {
    const alerts = createAlerts(
      [product("FS-1", 0)],
      [],
      t,
      "he",
      requests("FS-1", 40),
    );

    expect(keysOf(alerts)).toContain("oos_FS-1");
    expect(keysOf(alerts)).toContain("demand_FS-1");
  });

  it("uses the configured demand threshold", () => {
    const args = [[product("FS-1", 0)], [], t, "he", requests("FS-1", 20)];

    const atDefault = createAlerts(...args, { outOfStock: false });
    const raised = createAlerts(...args, {
      outOfStock: false,
      demandThreshold: 30,
    });

    expect(keysOf(atDefault)).toContain("demand_FS-1");
    expect(keysOf(raised)).not.toContain("demand_FS-1");
  });

  it("falls back to the built-in threshold for a nonsensical value", () => {
    const alerts = createAlerts(
      [product("FS-1", 0)],
      [],
      t,
      "he",
      requests("FS-1", HIGH_DEMAND_THRESHOLD + 1),
      { outOfStock: false, demandThreshold: 0 },
    );

    expect(keysOf(alerts)).toContain("demand_FS-1");
  });
});
