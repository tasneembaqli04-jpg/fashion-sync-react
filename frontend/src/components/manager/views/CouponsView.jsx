import { useEffect, useState } from "react";
import { useDialog } from "../../common/DialogProvider";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCouponUsage,
} from "../../../services/coupons/couponsService";
import { useLanguage } from "../../../translations/LanguageProvider";

export default function CouponsView() {
  const { confirmDialog, alertDialog } = useDialog();
  const { t: dict } = useLanguage();
  const t = dict.manager.coupons;

  const SEASON_OPTIONS = [
    { value: "", label: t.seasonAllYear },
    { value: "summer", label: t.seasonSummer },
    { value: "winter", label: t.seasonWinter },
    { value: "spring-autumn", label: t.seasonSpringAutumn },
  ];

  const [coupons, setCoupons] = useState([]);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("10");
  const [newSeason, setNewSeason] = useState("");

  async function refresh() {
    const [couponsData, usageData] = await Promise.all([
      getAllCoupons(),
      getAllCouponUsage(),
    ]);
    setCoupons(couponsData);
    setUsage(usageData);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function usageCountFor(code) {
    return usage.filter((u) => u.code === code).length;
  }

  async function handleAddCoupon() {
    const code = newCode.trim().toUpperCase();

    if (!code) {
      alertDialog(t.codeRequired);
      return;
    }

    if (coupons.some((c) => c.code === code)) {
      alertDialog(t.codeExists);
      return;
    }

    const discountPct = Math.max(1, Math.min(90, parseInt(newDiscount, 10) || 0));

    await addCoupon({
      code,
      discount: discountPct / 100,
      seasonOnly: newSeason || null,
      active: true,
    });

    setNewCode("");
    setNewDiscount("10");
    setNewSeason("");
    refresh();
  }

  async function handleToggleActive(coupon) {
    await updateCoupon(coupon.code, { active: !coupon.active });
    refresh();
  }

  async function handleDelete(code) {
    const confirmed = await confirmDialog(t.confirmDeleteCoupon.replace("{code}", code));
    if (!confirmed) return;
    await deleteCoupon(code);
    refresh();
  }

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div
        className={uiStyles.card}
        style={{ marginBottom: "1.2rem", padding: "1.2rem" }}
      >
        <div className={uiStyles.cardTitle} style={{ marginBottom: "0.8rem" }}>
          {t.newCouponTitle}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.8rem",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {t.codeLabel}
            </label>
            <br />
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder={t.codePlaceholder}
              style={{ padding: "0.5rem", borderRadius: "8px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {t.discountPercentLabel}
            </label>
            <br />
            <input
              type="number"
              min="1"
              max="90"
              value={newDiscount}
              onChange={(e) => setNewDiscount(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "8px", width: "80px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {t.seasonRestrictionLabel}
            </label>
            <br />
            <select
              value={newSeason}
              onChange={(e) => setNewSeason(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "8px" }}
            >
              {SEASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={`${uiStyles.btn} ${uiStyles.btnGold}`}
            onClick={handleAddCoupon}
          >
            {t.addCouponButton}
          </button>
        </div>
      </div>

      {loading ? (
        <div>{dict.common.loading}</div>
      ) : !coupons.length ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
          {t.noCouponsYet}
        </div>
      ) : (
        coupons.map((coupon) => (
          <div
            key={coupon.code}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-gold)",
              borderRadius: "14px",
              padding: "1rem 1.2rem",
              marginBottom: "0.8rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.7rem",
            }}
          >
            <div>
              <strong style={{ fontSize: "1.05rem" }}>{coupon.code}</strong>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                {Math.round(coupon.discount * 100)}{t.discountSuffix}
                {coupon.seasonOnly && (
                  <span>{t.validOnlyIn}{
                    SEASON_OPTIONS.find((o) => o.value === coupon.seasonOnly)?.label
                  }</span>
                )}
              </div>
              <div style={{ color: "var(--gold)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                {t.usedTimes.replace("{count}", usageCountFor(coupon.code))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span
                className={`${uiStyles.tag} ${
                  coupon.active ? uiStyles.tGreen : uiStyles.tRed
                }`}
              >
                {coupon.active ? t.active : t.inactive}
              </span>

              <button
                type="button"
                className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                onClick={() => handleToggleActive(coupon)}
              >
                {coupon.active ? t.disableButton : t.enableButton}
              </button>

              <button
                type="button"
                className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                onClick={() => handleDelete(coupon.code)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}