Running. Setup summary:

- Now: app runs in background, ⊞ in
  menu bar, no terminal needed
- On every login: Launch Agent
  starts it automatically
- Logs: tail -f /tmp/macos-wm.log

After rebuilding (code changes),
redeploy with:
launchctl unload ~/Library/LaunchAge
nts/com.erik.macos-wm.plist
npm run package
cp -r out/macos-wm-darwin-arm64/maco
s-wm.app /Applications/macos-wm.app
launchctl load ~/Library/LaunchAgent
s/com.erik.macos-wm.plist

Stop permanently:
launchctl unload ~/Library/LaunchAge
nts/com.erik.macos-wm.plist
