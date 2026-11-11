KaiBot for macOS, built from this fork.

- **Apple silicon:** `KaiBot-<version>-arm64.dmg`
- **Intel:** `KaiBot-<version>-x64.dmg`

These builds are ad-hoc signed but **not notarized** by Apple, because this
fork has no Developer ID certificate. After downloading, move KaiBot to
Applications and clear the quarantine flag once:

```sh
xattr -dr com.apple.quarantine /Applications/KaiBot.app
```

Then open KaiBot normally. Without that command macOS says the app is damaged
or from an unidentified developer.

Decision model (Settings → AI → Decision and extraction): choose "Jev" and
enter a Jev-compatible gateway URL plus API key. The URL must be HTTPS, or
plain HTTP only when the gateway runs on the same Mac. The gateway's model
name is optional and defaults to `jev-latest`.
