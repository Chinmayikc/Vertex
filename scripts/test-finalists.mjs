import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { validateDeck } from "../src/lib/finalists.deck.server.ts";
import {
  finalLinks,
  submissionOpen,
  verifiedGoogleEmail,
  uniqueLeader,
  csvCell,
} from "../src/lib/finalists.validation.ts";

const claims = { app_metadata: { provider: "google" }, amr: [{ method: "oauth" }] };
const user = {
  id: "leader",
  email: " Leader@Example.com ",
  email_confirmed_at: "2026-01-01",
  identities: [
    { provider: "google", identity_data: { email: "leader@example.com", email_verified: true } },
  ],
};
test("Google identity must be verified and used for the current sign-in", () => {
  assert.equal(verifiedGoogleEmail(user, claims), "leader@example.com");
  for (const invalid of [
    null,
    { ...user, email_confirmed_at: null },
    { ...user, email: "other@example.com" },
    {
      ...user,
      identities: [
        { provider: "email", identity_data: { email: user.email, email_verified: true } },
      ],
    },
    {
      ...user,
      identities: [
        { provider: "google", identity_data: { email: user.email, email_verified: false } },
      ],
    },
  ])
    assert.throws(() => verifiedGoogleEmail(invalid, claims));
  assert.throws(() => verifiedGoogleEmail(user, { ...claims, amr: [{ method: "password" }] }));
});
test("only a unique confirmed leader matches, trimmed and case insensitive", () => {
  const finalist = { id: "selected", lead_email: " LEADER@example.com " };
  assert.equal(uniqueLeader([finalist], "leader@example.com").id, "selected");
  assert.throws(() => uniqueLeader([finalist], "member@example.com"));
  assert.throws(() => uniqueLeader([], user.email));
  assert.throws(() => uniqueLeader([finalist, { ...finalist, id: "duplicate" }], user.email));
});
test("exact deadline cutoff and disabled-by-default dashboard/window", () => {
  const s = {
    dashboard_enabled: true,
    submissions_enabled: true,
    opens_at: "2026-11-14T00:00:00Z",
    closes_at: "2026-11-14T01:00:00Z",
  };
  assert.equal(submissionOpen(s, Date.parse(s.opens_at)), true);
  assert.equal(submissionOpen(s, Date.parse(s.closes_at) - 1), true);
  assert.equal(submissionOpen(s, Date.parse(s.closes_at)), false);
  assert.equal(submissionOpen({ ...s, dashboard_enabled: false }, Date.parse(s.opens_at)), false);
  assert.equal(submissionOpen({ ...s, submissions_enabled: false }, Date.parse(s.opens_at)), false);
});
test("all links required, HTTPS video, GitHub repo, and same project/demo allowed", () => {
  const links = {
    project: "https://example.com",
    demo: "https://example.com",
    github: "https://github.com/org/repo",
    video: "https://example.com/video",
  };
  assert.ok(finalLinks.safeParse(links).success);
  for (const key of Object.keys(links))
    assert.equal(finalLinks.safeParse({ ...links, [key]: "" }).success, false);
  assert.equal(
    finalLinks.safeParse({ ...links, video: "http://example.com/video" }).success,
    false,
  );
  assert.equal(
    finalLinks.safeParse({ ...links, github: "https://github.com.evil.example/org/repo" }).success,
    false,
  );
  assert.equal(
    finalLinks.safeParse({ ...links, project: "https://user:password@example.com" }).success,
    false,
  );
});
test("exact 5,000,000 bytes accepted, oversized/mismatched/misleading files rejected", () => {
  const pdf = Buffer.alloc(5_000_000, 32);
  pdf.write("%PDF-1.7\n");
  pdf.write("%%EOF", pdf.length - 5);
  assert.doesNotThrow(() => validateDeck(pdf, "slides.PDF", pdf.length));
  assert.throws(() =>
    validateDeck(Buffer.concat([pdf, Buffer.from("x")]), "slides.pdf", 5_000_001),
  );
  assert.throws(() => validateDeck(pdf, "slides.pdf", pdf.length - 1));
  assert.throws(() => validateDeck(pdf, "slides.pptx", pdf.length));
  assert.throws(() => validateDeck(Buffer.from("<html>fake pdf</html>"), "slides.pdf", 21));
  assert.throws(() => validateDeck(Buffer.from("not a ppt"), "slides.ppt", 9));
});
test("CSV quotes and escapes formula injection", () => {
  assert.equal(csvCell('Team "A"'), '"Team ""A"""');
  assert.equal(csvCell(' =HYPERLINK("bad")'), '"\' =HYPERLINK(""bad"")"');
});

test("isolated Postgres: migration, RLS, pending/save/replacement/idempotency/deadline", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE TABLE public.events(id uuid PRIMARY KEY,slug text);
 CREATE TABLE public.event_registrations(id uuid PRIMARY KEY,event_id uuid REFERENCES events(id),name text,email text,status text,form_data jsonb,created_at timestamptz DEFAULT now());
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint);
 GRANT USAGE ON SCHEMA public,auth,storage TO service_role;
 GRANT ALL ON ALL TABLES IN SCHEMA public,auth,storage TO service_role;`);
    await pg.exec(
      await readFile(
        new URL("../supabase/migrations/20261114000000_sarvam_finalists.sql", import.meta.url),
        "utf8",
      ),
    );
    const event = "00000000-0000-0000-0000-000000000001",
      team = "00000000-0000-0000-0000-000000000002",
      other = "00000000-0000-0000-0000-000000000003",
      uid = "00000000-0000-0000-0000-000000000004",
      u2 = "00000000-0000-0000-0000-000000000005";
    await pg.query("INSERT INTO events VALUES ($1,$2)", [event, "build-with-sarvam"]);
    for (let i = 1; i <= 50; i++) {
      const id = `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`;
      const email = `leader${i}@example.com`;
      const form = {
        team_name: `Team ${String(i).padStart(2, "0")}`,
        project_title: `Project ${String(i).padStart(2, "0")}`,
        problem: "Problem statement",
        track: "AI",
        solution: "Solution summary",
        members: [
          { name: `Leader ${i}`, email, is_lead: true },
          { name: `Member ${i}-2`, email: `member${i}-2@example.com`, is_lead: false },
          { name: `Member ${i}-3`, email: `member${i}-3@example.com`, is_lead: false },
          { name: `Member ${i}-4`, email: `member${i}-4@example.com`, is_lead: false },
        ],
      };
      await pg.query(
        "INSERT INTO event_registrations(id,event_id,name,email,status,form_data) VALUES ($1,$2,$3,$4,'approved',$5)",
        [id, event, `Leader ${i}`, email, form],
      );
    }
    await pg.query("INSERT INTO auth.users VALUES ($1),($2)", [uid, u2]);
    await pg.exec(
      await readFile(new URL("../scripts/import-sarvam-finalists.sql", import.meta.url), "utf8"),
    );
    assert.equal((await pg.query("SELECT count(*) AS n FROM event_finalists")).rows[0].n, 50);
    assert.equal(
      (await pg.query("SELECT dashboard_enabled,submissions_enabled FROM finalist_settings"))
        .rows[0].submissions_enabled,
      false,
    );
    assert.equal((await pg.query("SELECT count(*) AS n FROM event_registrations")).rows[0].n, 50);
    const reserve = async (id, tid = team) =>
      (
        await pg.query("SELECT * FROM reserve_finalist_upload($1,$2,$3,$4,$5,$6)", [
          event,
          tid,
          uid,
          "slides.pdf",
          5000000,
          id,
        ])
      ).rows[0];
    const commit = async (id, tid = team, usr = uid) =>
      (
        await pg.query("SELECT * FROM commit_finalist_submission($1,$2,$3,$4,$5)", [
          event,
          tid,
          usr,
          id,
          {
            project: "https://project.test",
            demo: "https://demo.test",
            github: "https://github.com/org/repo",
            video: "https://video.test",
          },
        ])
      ).rows[0];
    const id1 = "00000000-0000-0000-0000-000000000011",
      id2 = "00000000-0000-0000-0000-000000000012",
      id3 = "00000000-0000-0000-0000-000000000013",
      id4 = "00000000-0000-0000-0000-000000000014";
    await pg.exec("SET ROLE service_role");
    await assert.rejects(reserve(id1), /closed/);
    await pg.query(
      "UPDATE finalist_settings SET dashboard_enabled=true,submissions_enabled=true,opens_at=now()-interval '1 hour',closes_at=now()+interval '1 hour' WHERE event_id=$1",
      [event],
    );
    await reserve(id1);
    await reserve(id2);
    await reserve(id3);
    assert.equal(
      (await pg.query("SELECT count(*) AS n FROM final_project_submissions")).rows[0].n,
      0,
    );
    await assert.rejects(reserve(id4), /Three uploads/);
    await assert.rejects(commit(id1, other), /unavailable/);
    await assert.rejects(commit(id1, team, u2), /unavailable/);
    const first = await commit(id1);
    assert.equal(first.deck_size, 5000000);
    assert.ok(first.submitted_at);
    assert.ok(
      first.project_url && first.demo_url && first.github_url && first.video_url && first.deck_key,
    );
    assert.equal((await commit(id1)).submitted_at.getTime(), first.submitted_at.getTime());
    await pg.query("UPDATE finalist_uploads SET expires_at=now()-interval '1 second' WHERE id=$1", [
      id2,
    ]);
    await assert.rejects(commit(id2), /expired|unavailable/);
    assert.equal(
      (await pg.query("SELECT upload_id FROM final_project_submissions")).rows[0].upload_id,
      id1,
    );
    const replacement = await commit(id3);
    assert.equal(replacement.upload_id, id3);
    assert.equal(
      (await pg.query("SELECT count(*) AS n FROM final_project_submissions")).rows[0].n,
      1,
    );
    await reserve(id4);
    await pg.query("UPDATE finalist_settings SET closes_at=clock_timestamp() WHERE event_id=$1", [
      event,
    ]);
    await assert.rejects(commit(id4), /closed/);
    assert.equal(
      (await pg.query("SELECT upload_id FROM final_project_submissions")).rows[0].upload_id,
      id3,
    );
    assert.equal((await commit(id3)).upload_id, id3); // Network retry after deadline still returns the receipt.
    for (const role of ["anon", "authenticated"]) {
      await pg.exec("RESET ROLE; SET ROLE " + role);
      for (const table of [
        "finalist_settings",
        "event_finalists",
        "finalist_uploads",
        "final_project_submissions",
      ])
        await assert.rejects(pg.query(`SELECT * FROM ${table}`), /permission denied/);
      await assert.rejects(reserve(id4), /permission denied/);
      await assert.rejects(commit(id3), /permission denied/);
    }
    await pg.exec("RESET ROLE");
    assert.equal((await pg.query("SELECT count(*) AS n FROM event_registrations")).rows[0].n, 50);
    assert.equal(
      (await pg.query("SELECT public,file_size_limit FROM storage.buckets")).rows[0].public,
      false,
    );
    assert.equal(
      (await pg.query("SELECT public,file_size_limit FROM storage.buckets")).rows[0]
        .file_size_limit,
      5000000,
    );
  } finally {
    await pg.close();
  }
});

test("existing organizer authorization rejects students and judges, accepts heads/admins", async () => {
  const { assertStaff } = await import("../src/lib/roles.server.ts");
  function client(roles) {
    return {
      from(table) {
        return {
          select() {
            return this;
          },
          eq() {
            return table === "user_roles"
              ? Promise.resolve({ data: roles.map((role) => ({ role })) })
              : this;
          },
          maybeSingle() {
            return Promise.resolve({ data: null });
          },
        };
      },
    };
  }
  for (const roles of [[], ["judge"], ["mentor"]])
    await assert.rejects(assertStaff(client(roles), "viewer"), /heads and admins/);
  for (const roles of [["head"], ["admin"]]) assert.ok(await assertStaff(client(roles), "viewer"));
});

test("PPTX recognizes presentation containers and rejects renamed non-presentation ZIPs", () => {
  function zip(entries) {
    let offset = 0;
    const locals = [],
      central = [];
    for (const [name, text] of Object.entries(entries)) {
      const filename = Buffer.from(name),
        data = Buffer.from(text),
        local = Buffer.alloc(30),
        directory = Buffer.alloc(46);
      local.writeUInt32LE(0x04034b50);
      local.writeUInt32LE(data.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(filename.length, 26);
      directory.writeUInt32LE(0x02014b50);
      directory.writeUInt32LE(data.length, 20);
      directory.writeUInt32LE(data.length, 24);
      directory.writeUInt16LE(filename.length, 28);
      directory.writeUInt32LE(offset, 42);
      const item = Buffer.concat([local, filename, data]);
      locals.push(item);
      central.push(directory, filename);
      offset += item.length;
    }
    const c = Buffer.concat(central),
      end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50);
    end.writeUInt16LE(Object.keys(entries).length, 10);
    end.writeUInt32LE(c.length, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, c, end]);
  }
  const good = zip({
    "[Content_Types].xml":
      '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>',
    "_rels/.rels": "<Relationships/>",
    "ppt/presentation.xml": "<p:presentation/>",
  });
  assert.doesNotThrow(() => validateDeck(good, "deck.pptx", good.length));
  const doc = zip({
    "[Content_Types].xml":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
    "word/document.xml": "document",
  });
  assert.throws(() => validateDeck(doc, "deck.pptx", doc.length));
  assert.throws(() =>
    validateDeck(good.subarray(0, good.length - 20), "deck.pptx", good.length - 20),
  );
});
