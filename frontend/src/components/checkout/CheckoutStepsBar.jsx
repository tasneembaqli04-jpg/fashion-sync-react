import styles from "../../styles/checkout/CheckoutSteps.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CheckoutStepsBar({ currentStep = 1 }) {
  const { t: dict } = useLanguage();
  const t = dict.customer.checkout;

  const STEP_LABELS = [t.stepDetails, t.stepShipping, t.stepPayment, t.stepConfirm];

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