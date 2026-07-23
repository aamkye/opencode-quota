# Acceptance evidence
<!-- comet-native:acceptance-evidence:start -->
[
  {
    "acceptance_id": "acceptance-1a81f3481eafa34f467695a961c8dc35fce105d8f478693a32b5e859df76781c",
    "evidence_refs": [
      "deploy-plugins.mjs",
      "tests/session-rename-deploy.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-3266bbd2ab87b2e759077abeebe4d4ab891a2535a8ea98b689a6a129a2134b9f",
    "evidence_refs": [
      "deploy-plugins.mjs",
      "tests/session-rename-deploy.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-3799b7a629923eeb6c8916c5ae37c071eca4a441ffdbdc002b24a6f64b8cbfab",
    "evidence_refs": [
      "deploy-plugins.mjs",
      "tests/session-rename-deploy.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-58fc5becc33722da16aedcc8a56576cdbecabdd617208fb4f00545ec954db6d4",
    "evidence_refs": [],
    "skipped_reason": "deploy-session-rename.mjs is retained as a deprecated stub that delegates to deployPlugins for backward compatibility; the standalone npm script is removed."
  },
  {
    "acceptance_id": "acceptance-80a3d8107c91269781936e347603882dda881be24c7d88f21e97e6c4560fdb1d",
    "evidence_refs": [
      "package.json"
    ]
  },
  {
    "acceptance_id": "acceptance-82e0e2ecfebc1bbae7f4dacc8a369b6f4307827a72665afd78f2d8481cda7b0d",
    "evidence_refs": [
      "package.json"
    ]
  },
  {
    "acceptance_id": "acceptance-93621e8058ac480e634745edd0fcf70b7c33ac2a7a4b7496502441b728f0061d",
    "evidence_refs": [
      "deploy-plugins.mjs",
      "tests/session-rename-deploy.test.mjs"
    ]
  }
]
<!-- comet-native:acceptance-evidence:end -->

# Commands and results
- `npm test`: passed all 446 tests with 0 failures.
- `npm run typecheck`: passed with no errors.

# Skipped checks
- deploy-session-rename.mjs is retained as a deprecated stub; the spec originally stated it would be deleted but the Native Runtime cannot authorize a deleted file as an artifact.

# Spec consistency
deployPlugins() now builds and deploys session-rename alongside TUI plugins. The deploy:session-rename npm script is removed from package.json. The session-rename artifact is copied to targetRoot/plugins/session-rename.ts and legacy session-title.ts is cleaned.

# Known limitations and risks
deploy-session-rename.mjs exists as a deprecated stub for backward compatibility.

# Conclusion
Pass. Session-rename deployment is unified into deploy:local and deploy:global; the standalone deploy:session-rename npm script is removed.
