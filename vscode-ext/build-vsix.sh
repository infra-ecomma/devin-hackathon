#!/usr/bin/env bash
# Package this extension as a real .vsix and install it with VS Code's OWN
# installer, on both machines.
#
# This exists because hand-copying the files into ~/.vscode/extensions and
# hand-writing an extensions.json entry LOOKS installed and is not: a properly
# installed extension also carries a .vsixmanifest and a metadata block
# (source: vsix, pinned) that only the installer writes. Two rounds of "no it
# doesn't appear" came from that difference.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VER="$(node -p "require('$HERE/package.json').version")"
OUT="${TMPDIR:-/tmp}/tellurion-$VER.vsix"
STAGE="$(mktemp -d)"; trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/extension"
cp "$HERE"/package.json "$HERE"/extension.js "$HERE"/wrapper.js "$HERE"/README.md "$STAGE/extension/"
# the activity-bar icon has to be IN the package, or the container renders blank
[ -d "$HERE/media" ] && cp -r "$HERE/media" "$STAGE/extension/"

KIND="$(node -p "require('$HERE/package.json').extensionKind.join(',')")"
ENG="$(node -p "require('$HERE/package.json').engines.vscode")"
cat > "$STAGE/extension.vsixmanifest" <<XML
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="tellurion" Version="$VER" Publisher="tbk-labs" />
    <DisplayName>Tellurion</DisplayName>
    <Description xml:space="preserve">The live instrument for the project in this window.</Description>
    <Tags>visualization</Tags>
    <Categories>Visualization,Other</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="$ENG" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="$KIND" />
      <Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.EnabledApiProposals" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExecutesCode" Value="true" />
    </Properties>
  </Metadata>
  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
  </Assets>
</PackageManifest>
XML
cat > "$STAGE/[Content_Types].xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json"/>
  <Default Extension="js" ContentType="application/javascript"/>
  <Default Extension="md" ContentType="text/markdown"/>
  <Default Extension="vsixmanifest" ContentType="text/xml"/>
  <Default Extension="xml" ContentType="text/xml"/>
  <Default Extension="svg" ContentType="image/svg+xml"/>
</Types>
XML
( cd "$STAGE" && zip -qr "$OUT" . )
echo "built $OUT"

# Forge: use the CLI of the server that is RUNNING, not whichever one is oldest
# in ~/.vscode-server/bin. There are ten server installs on this box and only one
# is serving his window; installing into the wrong one looks successful and
# changes nothing he can see.
LIVE_SERVER="$(ps -eo args | grep -o '/home/[^ ]*/cli/servers/Stable-[a-f0-9]*/server' | head -1 || true)"
[ -n "$LIVE_SERVER" ] || echo "warn: no running VS Code server found; falling back to the newest install"
CS="${LIVE_SERVER:-$HOME/.vscode-server/cli/servers/$(ls -t "$HOME/.vscode-server/cli/servers" | grep -v json | head -1)/server}/bin/code-server"
"$CS" --install-extension "$OUT" --force
"$CS" --list-extensions --show-versions | grep tellurion

# Legion: his editor's UI side.
scp -q "$OUT" legion-win:'C:/Users/wmoum/tellurion.vsix'
printf '@echo off\r\ncall "%%LOCALAPPDATA%%\\Programs\\Microsoft VS Code\\bin\\code.cmd" --install-extension "%%USERPROFILE%%\\tellurion.vsix" --force\r\n' > "$STAGE/i.cmd"
scp -q "$STAGE/i.cmd" legion-win:'C:/Users/wmoum/i.cmd'
ssh legion-win 'cmd /c C:\Users\wmoum\i.cmd' | tail -2
ssh legion-win 'powershell -NoProfile -Command "Remove-Item C:\Users\wmoum\tellurion.vsix,C:\Users\wmoum\i.cmd -Force -ErrorAction SilentlyContinue"'
echo "installed on Forge and Legion; reload the window"
