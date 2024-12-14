## v0.6.23
1. Fixed the problem that the video will be paused in the replacement mode of live broadcast.
2. Fixed the problem that in the replacement mode, the danmaku input cannot pop up when pressing the enter key.

## v0.6.22
Fixed the problem of incorrect display when reopening the settings panel of the previous version

## v0.6.21
1. Optimize the replacement web video function
   1. Optimize the full-page function of videos embedded in iframes on web pages
   2. Add double-click to select full-screen or full-page setting
2. Upgrade the underlying code of the settings panel

## v0.6.20
Added the function of replacing web videos into extension players, which needs to be turned on in settings.

## v0.6.19
1. Fixed the issue of abnormal display of sidebar videos with episodes
2. Save the danmaku visible settings

## v0.6.18
Fixed an issue where the previous version update caused abnormalities on some websites

## v0.6.17
1. Fixed bilibili episode list not displayed in side
2. Optimizing js injection files will cause some websites to fail to load.

## v0.6.16
1. Added auto PIP feature: in hiding/scrolling the page
2. Fixed changeLog display position bug

## v0.6.15
1. Add docPIP webRTC mode
2. Fixed float button position not correct in single video container

## v0.6.14
Urgently fix the PIP black screen problem caused by the latest version of chrome and edge

## v0.6.13
1. Added a new PIP mode to support some sites, e.g., Crunchyroll, whose video element is not in a same-origin iframe
2. Added more language and language switch feature
3. Fixed Twitch danmaku failure problem
4. Fixed float button hidden setting didn't apply in some case
5. Adjust YouTube’s live broadcast and playback judgment
6. Adjust default playback rate menu

## v0.6.12
1. Added float button position adjustment
2. Added load danmaku from local or url feature

## v0.6.11
1. Improve sidebar easier to trigger
2. Improve Youtube is live check

## v0.6.10
1. Fixed the issue where the player screen is black in some cases
2. Fixed the audio and video desynchronization that may be caused by long pressing the double speed function

## v0.6.9
1. Fixed some small bugs
2. Fixed do not saved PIP width and height when in closed

## v0.6.7
1. Add 2 feat in extension menu, toggle float button visible + open setting
2. Fixed bilibili live can not send danmaku
3. Adjust extension permissions, add contextMenu, remove scripting

## v0.6.5
1. Fixed some subtitle state bug
2. Fixed bilibili live can not send danmaku
3. Add youtube side playlist data

## v0.6.4
1. Fixed bottom progress visible
2. Fixed bilibili live can not send danmaku

## v0.6.3
1. Fixed subtitle visible
2. FIxed some special char code in youtube subtitle 

## v0.6.2
Fixed some style in live mode

## v0.6.1
1. Player performance optimization
2. Added playback rate switching function

## v0.6.0
New HTML danmaku engine replace old version canvas danmaku engine

## v0.5.4
1. Fixed switching video in docPIP on bilibili 
2. Sync config in all opened tabs when config changed

## v0.5.3
1. Fixed the problem that when desktop zoom is turned on, switching video danmakus will become smaller and smaller
2. Fix possible repeated danmakus issues
3. Fixed abnormal time tooltips in progressBar

## v0.5.2
Fixed float button in twitch

## v0.5.1
Fixed the bug where sometimes some websites would have a white screen

## v0.5.0
1. Replaced the framework crxjs vite-plugin -> tsup config by myself
2. Fixed js inject in all website

## v0.4.6
Fixed bilibili /list/* page danmaku load

## v0.4.5
Fixed abnormal time tooltips

## v0.4.4
Add time tooltips in player progressbar

## v0.4.3
Adjust fontShadow default is false

## v0.4.2
Compatible with bilibili avid mode

## v0.4.1
Fixed the issue where picture-in-picture cannot pop up when clicking the icon in the extension bar

## v0.4.0
1. Replaced the framework plasma -> vite-plugin
2. Added [Adaptive size] and [Not Recommended Settings - Do not judge excessively long videos as live broadcasts] setting functions

## v0.3.20
Fixed bilibili live danmaku

## v0.3.21
Fixed bilibili live danmaku

## v0.3.19
Fixed the problem of mouse movement in subtitle menu + status display

## v0.3.18
Added subtitle function
1. Support bilibili, youtube subtitle system
2. Supports .srt .ass subtitle files, click "Add new subtitles" or drag the subtitle file into the player