# Code signing & notarization

Unsigned installers trigger SmartScreen (Windows) and Gatekeeper (macOS), and many
enterprise endpoint-protection policies block them outright. Sign before distributing.

`electron-builder` reads signing material from environment variables, so no secrets are
stored in this repository.

## Windows

### Option A — Azure Trusted Signing (recommended; EV, cloud-held keys)

1. Create a Trusted Signing account and a certificate profile in Azure.
2. Grant the CI service principal the **Trusted Signing Certificate Profile Signer** role.
3. Export these repository secrets and expose them as environment variables in the
   release workflow:

| Secret | Value |
|---|---|
| `AZURE_TENANT_ID` | Entra tenant id |
| `AZURE_CLIENT_ID` | Service-principal application id |
| `AZURE_CLIENT_SECRET` | Service-principal secret |
| `AZURE_CODE_SIGNING_ACCOUNT` | Trusted Signing account name |
| `AZURE_CERT_PROFILE` | Certificate profile name |
| `AZURE_ENDPOINT` | e.g. `https://eus.codesigning.azure.net` |

`electron-builder` ≥ 26 signs Windows artifacts from these automatically when present.

### Option B — PFX certificate (traditional OV/EV)

| Variable | Value |
|---|---|
| `CSC_LINK` | base64 of the `.pfx`, or a path/URL to it |
| `CSC_KEY_PASSWORD` | the PFX password |

## macOS

| Variable | Value |
|---|---|
| `CSC_LINK` | base64 of the Developer ID `.p12` |
| `CSC_KEY_PASSWORD` | the `.p12` password |
| `APPLE_ID` | Apple account used for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | app-specific password for that account |
| `APPLE_TEAM_ID` | 10-character team id |

The hardened-runtime entitlements the app requires already live in
[`entitlements.mac.plist`](entitlements.mac.plist). Notarization is requested
automatically by `electron-builder` when the Apple variables are present.

## Verifying a build

```powershell
# Windows: the signature should chain to your publisher and the timestamp be present
Get-AuthenticodeSignature .\release\DevPilotX-0.1.0-x64.exe | Format-List

# macOS: hardened runtime + notarization ticket stapled
codesign -dv --verbose=4 "/Applications/DevPilotX.app"
spctl -a -vv "/Applications/DevPilotX.app"
xcrun stapler validate "/Applications/DevPilotX.app"
```

## Windows MSI (enterprise deployment)

NSIS is the consumer installer. For Intune / SCCM / Group Policy deployment there is a
separate WiX-based target:

```bash
npm run package:win:msi
```

This requires the [WiX Toolset v3](https://github.com/wixtoolset/wix3/releases) on
`PATH` (`candle.exe` / `light.exe`). The MSI honours the same signing variables above.
