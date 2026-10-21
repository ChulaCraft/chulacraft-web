"use client";

import { LegalPage } from "@/components/legal-page";
import { PreviewFrame, text, useFormValues } from "@/components/form-preview";

/** The page exactly as visitors will see it, updating while you type. */
export function PagePreview({ formId, title, saved, effective }: { formId: string; title: string; saved: string; effective: string }) {
  const values = useFormValues(formId);
  return (
    <PreviewFrame label="Preview">
      <LegalPage preview title={title} source={text(values, "body", saved)} effective={effective} />
    </PreviewFrame>
  );
}
