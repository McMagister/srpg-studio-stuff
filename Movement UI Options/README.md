# Movement UI Options Plugin


## About This Plugin

This plugin is created by me to provide several Quality-of-Life UI enhancements when moving a unit around the map.  It is built on the Movement Arrows plugin created by Cube, a Japanese scripter.

There are 4 config options that can be toggled in the config menu in-game.
All four features are independent so please pick and choose whichever combination you like.

1. Display Movement Arrow
    - When selecting a unit to move, displays a blue movement arrow between target and destination like in the GBA Fire Emblems.

2. Display Ghost Preview
    - When selecting a unit to move, displays a translucent version of the unit at the destination location like in the 3DS Fire Emblems.

3. Display Remaining Movement
    - When selecting a unit to move, displays the remaining movement points, allowing you to easily figure out the movement cost of different types of terrain.

4. Display Targeting Lines
    - When selecting a unit to move, a line wil be drawn between your unit and all enemies that are in range of that unit, similar to FE: Three Houses except that the AI is not taken into effect.  Targeting lines will be drawn for every enemy in range regardless of whether that enemy will actually attack your unit on the next enemy phase.

## Sample Screenshots

### Configuration Menu

![Configuration Menu][1]

### MoveArrow, RemainingMovement and GhostPreview

![MoveArrow, RemainingMovement and GhostPreview][2]

### Targeting Lines/Arrows

![Targeting Arrows][3]

[1]: Options.png
[2]: MoveArrow+RemainingMovement+GhostPreview.png
[3]: TargetingArrows.png


## Usage

To install this plugin, simply copy the Material and Plugin folders into the root directory of your game.
Two movement arrow colors are available in the Material/MoveArrow folder.
By default the darker color arrow is used.
If you want to use the other one, please rename "OldMoveArrow.png" to "MoveArrow.png".


## Credits

The original Movement Arrow plugin was developed by キュウブ (English alias: "Cube").

The Ghost Preview, Remaining Movement and Targeting Lines features were developed by McMagister building upon the original plugin by Cube.


## Terms and Conditions

Usage rights are the same as the original Japanese script, below is the Google Translate of those terms and conditions:

· Use is limited to the game using the SRPG Studio.

· Commercial and it does not question non-commercial. It is free.

· And processing and the like, there is no problem.

· Credit specified without OK (if you specify thank you "Kyuubu")

· And re-distribution, reproduction OK (it does not have to be the person who can fix if there is a bug is asked to distribute a modified version on your own)

· Wiki OK

· SRPG Studio Terms and Conditions, please comply.


## Changelog

2020-04-13: Modified by McMagister

- Set Default unit facing
- Added Ghost Preview of the unit's final location, like in the 3DS Fire Emblems

2020-04-16:

- Show remaining Movement Points if the flag is set in config-movepoint.js (From the Official plugins)

2020-04-17:

- Show target lines from enemies that are in range of your unit, like in Three Houses

2020-04-18:

- MAJOR: Fixed the performance issue with the targeting lines, now enemy range is checked only on cursor move and not every frame.
- Add fixes by Repeat:
	- don't draw targeting lines for waitOnly and moveOnly AI patterns
	- account for Canto
- Fix initial display of remaining movement being inaccurate if previous unit to move had remanining movement points
- Don't display remaining movement points when unit is first selected.
- Make targeting lines straight instead of curve, seems to slightly improve performance and looks better (subjective)
	- The old bezier curves are merely commented out, can be re-enabled by editing this script
- Changed "MoveAllow" directory and images to "MoveArrow"
- Cleaned up the code a lot.


2020-04-19:

- Make targeting lines with proper arrowheads, removed other options like beziers
- Add bugfix by Repeat for Ghost Preview

## Original Readme and Changelog for "Movement Arrows" plugin by Cube

````
　ユニット移動前に移動経路を表示するスクリプト ver1.4
■作成者
キュウブ

■概要
封印以降?みたいに自軍ユニット選択後、
移動可能範囲にカーソルを置くと移動経路が表示されるようになります。

■使い方
別途付属のMoveAllowフォルダをMaterialフォルダの中にそのまま入れてください

■更新履歴
2017/8/13 ver 1.4
・軽量化

2017/8/11 ver 1.3
・移動経路取得処理を変更した（なるべく直前の移動経路に近いルートを選出する仕組みになった）
・無駄な事やっている箇所をリファクタリング

2016/12/31 ver 1.2
バグはありませんが以下のような仕様変更を行いました（矢印のパターンが増えたので前verを使用されていた場合はMoveAllowフォルダも更新してください）
・他の自軍ユニットにカーソルを被せた時も移動経路が消えないようにした
・矢印の上に対象ユニットを表示するようにした（以前は対象ユニットの上に矢印が被さっていた）
・対象ユニットのマスに矢印の始点を表示させるようにした
・ついでに可読性の悪い手抜きコードだったのでリファクタリングした

2016/12/30 ver 1.1
移動経路が一瞬ぶれる事があったのを修正(名前未定(仮) 氏による修正)

■対応バージョン
SRPG Studio Version:1.144

■規約
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・加工等、問題ありません。
・クレジット明記無し　OK (明記する場合は"キュウブ"でお願いします)
・再配布、転載　OK (バグなどがあったら修正できる方はご自身で修正版を配布してもらっても構いません)
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
````

