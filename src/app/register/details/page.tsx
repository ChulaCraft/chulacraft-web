import { PixelIcon } from "@/components/icons";
import { StepProgress } from "@/components/step-progress";
import { toStudyLevel } from "@/lib/faculties";
import { requireVerifiedUser } from "@/lib/verified-user";
import { ServiceUnavailable } from "../../dashboard/service-unavailable";
import { AboutYouForm } from "./about-you-form";

/** Step 3 of sign-up, after Discord and Chula verification. */
export default async function AboutYouPage() {
  const session = await requireVerifiedUser();
  if (!session) return <ServiceUnavailable />;
  const { supabase, user } = session;

  const [profile, claim] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, nickname, study_level, faculty, major").eq("user_id", user.id).maybeSingle(),
    supabase.from("chula_claims").select("email").eq("user_id", user.id).maybeSingle()
  ]).catch(() => [null, null] as const);
  if (!profile || !claim || profile.error || claim.error) return <ServiceUnavailable />;
  const p = profile.data;

  return (
    <>
      <main className="narrow w-560">
        <div>
          <div className="stack">
            <StepProgress step={3} />
            <h1 className="page-title">Tell us about you</h1>
            <p className="lead">Last step. Only you and server admins can see this, and you can change it later on your profile.</p>
          </div>

          {claim.data?.email && (
            <div className="alert alert-success" role="status">
              <PixelIcon name="check" />
              <p className="alert-body">Chula account verified: <span className="mono">{claim.data.email}</span></p>
            </div>
          )}

          <AboutYouForm
            initial={{ first: p?.first_name ?? "", last: p?.last_name ?? "", nick: p?.nickname ?? "", level: toStudyLevel(p?.study_level), faculty: p?.faculty ?? "", major: p?.major ?? "" }}
          />
        </div>
      </main>
    </>
  );
}
