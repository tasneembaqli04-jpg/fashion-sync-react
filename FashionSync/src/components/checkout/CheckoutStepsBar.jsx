import styles from "../../styles/checkout/CheckoutSteps.module.scss";
import { useLanguage } from "../../context/LanguageContext";

export default function CheckoutStepsBar({ currentStep = 1 }) {
  const { t } = useLanguage();
  const STEP_LABELS = [
    t.checkout.steps.details,
    t.checkout.steps.shipping,
    t.checkout.steps.payment,
    t.checkout.steps.confirm,
  ];

  return (
    <div className={styles.stepsBar}>
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={stepNumber} className={styles.stepGroup}>
            <div
              className={[
                styles.step,
                isDone ? styles.done : "",
                isActive ? styles.active : "",
              ].join(" ")}
            >
              <div className={styles.stepNum}>
                {isDone ? "✓" : stepNumber}
              </div>
              <span>{label}</span>
            </div>

            {stepNumber < STEP_LABELS.length && (
              <div className={styles.stepSep}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
