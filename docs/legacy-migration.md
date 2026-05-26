# Legacy Migration Verification

The Rails app stays at the repository root until the rewrite is ready for promotion. Migration verification runs from `rewrite/` and compares a Rails export JSON file against the target Postgres database.

## Expected Rails Export Shape

```json
{
  "users": [{ "id": 1, "email": "ada@example.com" }],
  "posts": [
    {
      "id": 10,
      "link": "https://example.com/story",
      "comments_count": 1,
      "click_count": 3
    }
  ],
  "comments": [
    {
      "id": 100,
      "commentable_id": 10,
      "user_id": 1
    }
  ]
}
```

## Verification Command

```sh
LEGACY_EXPORT_JSON=/path/to/rails-export.json \
DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit \
npm run legacy:verify
```

The verifier checks row counts, legacy IDs, user emails, post links, post counters, and comment post/user relationships. It exits non-zero if the export is missing, the target database is missing, or any check fails.
