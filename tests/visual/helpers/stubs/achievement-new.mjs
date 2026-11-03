// /admin/commu/achievements/new (tests/visual/achievement-new.spec.ts): the write
// paths the New form uses. POST /__visual/achievement-new?fail=upload|save|none
// picks what fails; a tier of "legendary" is refused by the meta RPC (INVALID).
// GET /__visual/achievement-new returns the calls seen, newest last.
let fail = "none";
let calls = [];

export default function achievementNew({ request, response, url, json, readJson, state }) {
  const rpc = url.pathname.replace("/rest/v1/rpc/", "");
  const refuse = (message) => json(response, 400, { code: "P0001", message, details: null, hint: null });

  if (url.pathname === "/__visual/achievement-new") {
    if (request.method === "POST") {
      fail = url.searchParams.get("fail") ?? "none";
      calls = [];
      json(response, 200, { fail });
    } else {
      json(response, 200, calls);
    }
    return true;
  }
  if (request.method === "POST" && url.pathname.startsWith("/storage/v1/object/achievements/")) {
    calls.push("upload");
    request.resume();
    request.on("end", () => {
      if (fail === "upload") json(response, 500, { message: "storage down" });
      else json(response, 200, { Key: url.pathname });
    });
    return true;
  }
  if (request.method === "DELETE" && url.pathname.startsWith("/storage/v1/object/achievements")) {
    calls.push("remove");
    request.resume();
    request.on("end", () => json(response, 200, []));
    return true;
  }
  if (request.method === "POST" && ["admin_upsert_achievement", "admin_set_achievement_meta", "admin_delete_achievement"].includes(rpc)) {
    if (!state.authenticated) { refuse("FORBIDDEN"); return true; }
    readJson(request, (args) => {
      calls.push(rpc);
      if (rpc === "admin_upsert_achievement") {
        if (fail === "save") refuse("FORBIDDEN");
        else json(response, 200, args.p_id);
      } else if (rpc === "admin_set_achievement_meta") {
        if (args.p_tier === "legendary") refuse("INVALID");
        else json(response, 200, null);
      } else {
        json(response, 200, []);
      }
    });
    return true;
  }
  return false;
}
