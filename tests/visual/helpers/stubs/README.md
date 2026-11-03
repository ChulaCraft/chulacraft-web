Per-task stub routes. Each `*.mjs` here is loaded by `../supabase-stub.mjs` and
default-exports `(ctx) => boolean`, called for every request the stub has no
route for. Return `true` once the response is sent. `ctx` has `request`,
`response`, `url`, `json(response, status, body)`, `readJson(request, cb)` and a
`state` with live `authenticated` and `role`.
