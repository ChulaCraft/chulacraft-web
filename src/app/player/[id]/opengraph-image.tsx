import { achievementImage, showcase, type AchievementGroup } from "@/components/achievement-grid";
import { cardImage, OG_SIZE, OG_TYPE, pictureData, siteImage } from "@/lib/og-image";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export const alt = "ChulaCraft player";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

/** Name, avatar and top badges, only when the asker may see the profile
 *  (player_card's `hidden` is can_view). get_player_profile is signed-in
 *  only, so a crawler, a hidden profile or an unknown id gets the site image,
 *  the same one page.tsx's metadata names. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return siteImage();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_player_profile", { p_user_id: id }).then((r) => r, () => ({ data: null }));
  const card = data as { display_name: string; avatar_url: string | null; hidden: boolean; achievements?: AchievementGroup[]; minecraft_names?: string[] } | null;
  if (!card || card.hidden) return siteImage();
  const [avatar, ...badges] = await Promise.all([
    pictureData(card.avatar_url, 320, 320),
    ...showcase(card.achievements ?? []).map((group) => pictureData(achievementImage(group.image_path), 88, 88)),
  ]);
  const names = card.minecraft_names ?? [];
  return cardImage({
    kicker: "ChulaCraft player",
    title: card.display_name,
    lines: names.length ? [names.slice(0, 3).join(" · ")] : [],
    picture: avatar ? { src: avatar, width: 320, height: 320 } : null,
    badges: badges.filter((b): b is string => b !== null),
  });
}
