## v0.6.48
1. Fixed the problem of using input method in Youtube live danmaku input box to fill undefined
2. Fixed some pop-up iframe exception problem in Youtube live
3. Fixed the problem that floating buttons can sometimes be huge in the initial situation

## v0.6.47
1. Supports Netflix, including sidebar switching + subtitle function
2. Fixed the problem of the failure of the Douyin danmaku, but the danmaku input cannot be fixed for the time being

## v0.6.46
Fixed the issue of YouTube's subtitle loading failure

## v0.6.45
Fixed the legacy issue of bilibili live at 0.6.43

## v0.6.44
After opening the PIP, modify the web page title so that the window manager can distinguish windows by tshanli

## v0.6.43
1. Fixed the issue that the keyboard control in replacement mode does not take effect on some websites
2. Temporarily fix the problem of failed connection of bilibili live danmaku ws

## v0.6.42
1. Modify the option of [Move PIP position after open], and the default is [Last closed position]. If you are using Brave browser, it is recommended to switch to [Customize]
2. Fixed the black screen problem when switching videos in replacement mode

## v0.6.41
1. Remove the advanced settings of [Move PIP pos after open], and change it to [Auto save PIP position], and it is turned on by default.
2. Fixed the issue of video being paused when open PIP

## v0.6.40
Fixed some issues involving initializing the position and size of the PIP

## v0.6.39
Compatible with some bilibili videos that do not display in the sidebar

## v0.6.38
1. Add the function of switching the previous/next video + shortcut keys
2. Add custom hidden player button settings
3. Add sidebar triggering mode settings

## v0.6.37
Fixed some small bugs

## v0.6.36
Added the Backspace key to clear the shortcut key

## v0.6.35
1. Added progress bar preview function, currently only supports bilibili and Youtube
2. Fixed the problem of subtitle data error in bilibili

## v0.6.34
1. Added subtitle translation function to support bilingual subtitles
2. Fixed the issue of repeatedly opening the PIP without loading the danmakus

## v0.6.33
Added custom shortcut key settings

## v0.6.32
Restore the previous logic for adjusting the position after enabling PIP

## v0.6.31
1. Fixed the problem of floating button display settings
2. Changelog display issues that are compatible with lower versions of Chrome

## v0.6.30
1. Inject the PIP of the original website and change it to the PIP mode of the startup with extension
2. When the automatic PIP is enabled, the PIP will be automatically close when returned to original position

## v0.6.29
1. Added ctrl + mouse scrolling to adjust the PIP size function
2. Added quick hidden moving position option
3. Fixed to close the PIP after quick hiding, and the size was incorrect when reopened

## v0.6.28
1. Added support for Huya danmaku, but only solid color + scrolling
2. Added position adjustment function settings after turning on PIP
3. Added a shortcut key function to quickly hide PIP
4. Fixed the issue where repeated danmakus may occur when opening PIP repeatedly.

## v0.6.27
1. Added a new HTML danmaku engine IronKinoko version
2. Fixed the problem of incorrect danmakus when switching between bilibili episode.
3. Added the function of merging YouTube subtitles with similar time to avoid subtitle jitter
4. Added the function of dynamic size of subtitles, which is the same as the dynamic size of danmakus.

## v0.6.26
Fixed some small bugs

## v0.6.25
1. Fixed the problem of invalid shortcut keys after switching videos
2. Added multiple video shortcut key functions
3. Adjust the live broadcast to also display the pause button
4. Optimizing the floating button can cause a shaking issue on the page.

## v0.6.24
1. Fixed the problem of invalid subtitle size setting
2. Fixed the problem that Douyu live video will get stuck after a few minutes
3. Fixed the scrolling problem that may occur on Youtube in some cases

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
1. Improve sidebar easier to trigger by Xmarmalade
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