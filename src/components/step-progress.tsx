/** "Step N of 3" bar used across sign-up (Verify = 2, About you = 3). */
export function StepProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="step-progress">
      <div aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <span key={i} data-state={i + 1 < step ? "done" : i + 1 === step ? "current" : undefined} />)}
      </div>
      <span>Step {step} of {total}</span>
    </div>
  );
}
