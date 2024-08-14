/*--------------------------------------------------------------------------
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

--------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------
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
- Make targeting lines with proper arrowheads
- Updated and added back bezier curves as a targeting line option
- Add bugfix by Repeat for Ghost Preview

--------------------------------------------------------------------------*/

// 矢印描画用の定義(Materialフォルダ用)
var MOVE_ALLOW_SETTING = {
	Folder        : 'MoveArrow',		// Materialフォルダ内のフォルダ名
	Image         : 'MoveArrow.png',	// 画像ファイル名
	EndPoint      : {	//画像ファイル内における終端部分の矢印のオフセット[x座標, y座標]
				Left :   [GraphicsFormat.MAPCHIP_WIDTH * 0, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 左矢印
			 	Up   :   [GraphicsFormat.MAPCHIP_WIDTH * 1, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 上矢印
				Right:   [GraphicsFormat.MAPCHIP_WIDTH * 2, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 右矢印
				Down :   [GraphicsFormat.MAPCHIP_WIDTH * 3, GraphicsFormat.MAPCHIP_HEIGHT * 0]	// 下矢印	
			},
	Line	      : {	//画像ファイル内における中間部分の矢印のオフセット[x座標, y座標]
				DownRight   :   [GraphicsFormat.MAPCHIP_WIDTH * 4, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 下-右曲線
			 	UpRight     :   [GraphicsFormat.MAPCHIP_WIDTH * 5, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 上-右曲線
				UpLeft	    :   [GraphicsFormat.MAPCHIP_WIDTH * 6, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 上-左曲線
				DownLeft    :   [GraphicsFormat.MAPCHIP_WIDTH * 7, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 下-左曲線
				Horizontal  :   [GraphicsFormat.MAPCHIP_WIDTH * 8, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 横直線
				Vertical    :   [GraphicsFormat.MAPCHIP_WIDTH * 9, GraphicsFormat.MAPCHIP_HEIGHT * 0]  // 縦直線
			},
	StartPoint    : {	//画像ファイル内における始点部分の矢印のオフセット[x座標, y座標]
				Left :   [GraphicsFormat.MAPCHIP_WIDTH * 10, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 左に向かう始点
			 	Up   :   [GraphicsFormat.MAPCHIP_WIDTH * 13, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 上に向かう始点
				Right:   [GraphicsFormat.MAPCHIP_WIDTH * 12, GraphicsFormat.MAPCHIP_HEIGHT * 0], // 右に向かう始点
				Down :   [GraphicsFormat.MAPCHIP_WIDTH * 11, GraphicsFormat.MAPCHIP_HEIGHT * 0]	 // 下に向かう始点
			}	  
};

(function() {

/*
 * StructureBuilder.buildMovementLocus
 *  @return
 *  movementLocusのオブジェクトを返す
 *
 */
StructureBuilder.buildMovementLocus = function() {
	return {
		cource: [],
		movePoint: 0,
		goalX: 0,
		goalY: 0
	};
};

MapSequenceArea._movementLocus = null;
MapSequenceArea._allowPic = null;
MapSequenceArea._prevMapCursorMapX = 0;
MapSequenceArea._prevMapCursorMapY = 0;
MapSequenceArea._addCourceSimulator = null;
MapSequenceArea._unitMovParameter = 0;

MapSequenceArea._movePoint = 0; // for storing currently expended movement points
MapSequenceArea._simulator2; // for targeting lines
MapSequenceArea._targetLineArray = []; // for targeting lines

var alias00 = MapSequenceArea._prepareSequenceMemberData;

MapSequenceArea._prepareSequenceMemberData = function(parentTurnObject) {
	this._movementLocus = StructureBuilder.buildMovementLocus();
	this._allowPic = CacheControl.getAllowPic();
	this._addCourceSimulator = root.getCurrentSession().createMapSimulator();

	alias00.call(this, parentTurnObject);
};

var alias01 = MapSequenceArea._completeSequenceMemberData;
MapSequenceArea._completeSequenceMemberData = function(parentTurnObject) {
	alias01.call(this, parentTurnObject);
	this._initMovementLocus();
	this._prevMapCursorMapX = this._mapCursor.getX();
	this._prevMapCursorMapY = this._mapCursor.getY();
	this._unitMovParameter = ParamBonus.getMov(this._targetUnit);//何度も計算するのは無駄でしかないのでここで移動力を求めておく
};

/*
 * MapSequenceArea._initMovementLocus
 *   movementLocusの初期設定を行う
 */
MapSequenceArea._initMovementLocus = function() {
	this._movementLocus.movePoint = 0;
	this._movementLocus.cource = [];
	this._movementLocus.goalX = this._targetUnit.getMapX();
	this._movementLocus.goalY = this._targetUnit.getMapY();

	if (!ConfigItem.TargetingLines.isDisabled()) {
		this._setupTargetingLines(CurrentMap.getIndex(this._movementLocus.goalX, this._movementLocus.goalY));
	}
};

MapSequenceArea._getDefaultDirection = function() {
	return DirectionType.RIGHT; // Default is DirectionType.RIGHT
};

/*
 * 移動対象のユニットのキャラチップを描画します
 * 既に描画されているキャラチップと全く同じ画像を上に被せる事を想定しています
 * 矢印の画像の上に対象ユニットのキャラチップを描画するためです（この処理を行わないと対象ユニットのキャラチップの上に矢印が被さっているように見えてしまう）
 * Google translate:
 * Draw a character chip of the unit to be moved
 * It is assumed that the cover on the exact same image as the character chip that has already been drawn
 * Is to draw the character chip of the target unit on top of the arrow of the image (it will look like the arrow is overlaying on top of the character chip and the target unit do not do this)
 */  
MapSequenceArea._drawMoveUnit = function(direction) {
	var x, y, x2, y2;
	var unitRenderParam = StructureBuilder.buildUnitRenderParam();

	x = this._targetUnit.getMapX() * GraphicsFormat.MAPCHIP_WIDTH;
	y = this._targetUnit.getMapY() * GraphicsFormat.MAPCHIP_HEIGHT;
	x2 = root.getCurrentSession().getMapCursorX() * GraphicsFormat.MAPCHIP_WIDTH;
	y2 = root.getCurrentSession().getMapCursorY() * GraphicsFormat.MAPCHIP_HEIGHT;

	// Unit remains in original tile
	// By default, the unit is using the idle animation
	if (!ConfigItem.MovementArrow.isDisabled()) {
		if (this._targetUnit.getUnitType() == UnitType.PLAYER) {
			unitRenderParam.direction = MapSequenceArea._getDefaultDirection();
			unitRenderParam.animationIndex = MapLayer.getAnimationIndexFromUnit(this._targetUnit);
			unitRenderParam.isScroll = true;
			UnitRenderer.drawScrollUnit(this._targetUnit, x, y, unitRenderParam);
		}
	}

	// Ghost Preview (like in 3DS games) appears under cursor, at half opacity
	if (!ConfigItem.GhostPreview.isDisabled()) {
		if (direction == null || this._targetUnit.getUnitType() != UnitType.PLAYER) {
			// only player units get the ghost preview
		} else {
			unitRenderParam.direction = direction;
			unitRenderParam.isScroll = true;
			unitRenderParam.alpha = 128;
			UnitRenderer.drawScrollUnit(this._targetUnit, x2, y2, unitRenderParam);
		}
	}

	// Show remaining Movement Points if the flag is set in config-movepoint.js (From the Official plugins)
	if (this._movementLocus.movePoint != null && this._isTargetMovable() && !ConfigItem.MovePointVisible.isDisabled()) {
		var remainingMove = this._unitMovParameter - this._movementLocus.movePoint;
		// Accounting for canto
		if(this._parentTurnObject.isRepeatMoveMode()){ 
			remainingMove = this._unitMovParameter - this._targetUnit.getMostResentMov() - this._movementLocus.movePoint;
		}
		if (remainingMove > 0 && remainingMove < this._unitMovParameter) {
			NumberRenderer.drawNumber(
				x2 + 10 - root.getCurrentSession().getScrollPixelX(), 
				y2 + 3 - root.getCurrentSession().getScrollPixelY(),
				remainingMove);
		}
	}
	
	// draw target lines
	if (!ConfigItem.TargetingLines.isDisabled()) {
		for (var i = 0; i < this._targetLineArray.length; i++) {
			if(this._isTargetMovable())
			{
				this._targetLineArray[i].drawShape();
			}	
		}
	}
	
};

var alias1 = MapSequenceArea._moveArea;
MapSequenceArea._moveArea = function() {

	var goalIndex, targetUnitX, targetUnitY, newCourceSimulator;
	var result = alias1.call(this);
	var currentMapCursorX = this._mapCursor.getX();
	var currentMapCursorY = this._mapCursor.getY();
	
	// カーソル移動が行われて
	// 移動可能なユニットであるならば移動経路を求める
	if ((this._prevMapCursorMapX !== currentMapCursorX || this._prevMapCursorMapY !== currentMapCursorY) &&
		this._isTargetMovable() === true) {

		// カーソル位置が移動可能範囲にあるなら移動経路を求める
		// 不可能ならば経路をリセットする
		if (this._unitRangePanel.isMoveArea(currentMapCursorX, currentMapCursorY) > 0) {

			newCourceSimulator = this._unitRangePanel.getSimulator();

			// 追加コースの検証を行うためにユニットを一時的に以前の目標地点まで移動させる
			targetUnitX = this._targetUnit.getMapX();
			targetUnitY = this._targetUnit.getMapY();
			this._targetUnit.setMapX(this._movementLocus.goalX);
			this._targetUnit.setMapY(this._movementLocus.goalY);
			this._addCourceSimulator.startSimulation(this._targetUnit, this._unitMovParameter);
			this._targetUnit.setMapX(targetUnitX);
			this._targetUnit.setMapY(targetUnitY);

			goalIndex = CurrentMap.getIndex(currentMapCursorX, currentMapCursorY);
			CourceBuilder.updateMovementLocus(this._targetUnit, goalIndex, newCourceSimulator, this._addCourceSimulator, this._movementLocus);

			if (!ConfigItem.TargetingLines.isDisabled()) {
				this._setupTargetingLines(goalIndex);
			}
		} else {
			this._initMovementLocus();

			// don't draw targeting lines if the cursor is over an enemy unit or other invalid move area
			if (!ConfigItem.TargetingLines.isDisabled()) {
				this._targetLineArray = [];
			}
		}
	}

	this._prevMapCursorMapX = currentMapCursorX;
	this._prevMapCursorMapY = currentMapCursorY;

	return result;
};

MapSequenceArea._setupTargetingLines = function(goalIndex) {
	// Get the list of Enemies for targeting lines
	// Reset the existing targeting lines
	// For each enemy, check their weapon range (if they have usable weapons) and see if the player unit is within range

	this._targetLineArray = [];
	var currentMapCursorX = this._mapCursor.getX();
	var currentMapCursorY = this._mapCursor.getY();
	var ListE = EnemyList.getAliveList();
	var enemyUnit;
	if (this._simulator2 == null) this._simulator2 = root.getCurrentSession().createMapSimulator();


	for (var e = 0; e < ListE.getCount(); e++){
		enemyUnit = ListE.getData(e);
		if (enemyUnit.isInvisible()) continue; // In order to work with fog of war

		// If enemy AI is type "Wait Only" or "Move Only", then skip it
		patternType = enemyUnit.getAIPattern().getPatternType();
		if(patternType === PatternType.WAIT && enemyUnit.getAIPattern().getWaitPatternInfo().isWaitOnly()) continue;
		if(patternType === PatternType.MOVE && enemyUnit.getAIPattern().getMovePatternInfo().getMoveAIType() === MoveAIType.MOVEONLY) continue;
	
		var attackRange = UnitRangePanel.getUnitAttackRange(enemyUnit);
		var startRange = attackRange.startRange;
		var endRange = attackRange.endRange;
		var enemyMov = attackRange.mov; // ParamBonus.getMov(enemyUnit)
		var enemyHasWeapon = attackRange.endRange !== 0;
		
		if (enemyHasWeapon) {
			// Optimization: if the enemy's movement + weapons range is greater
			// than the enemy's distance from the map cursor, then skip it
			var xDist = Math.abs(enemyUnit.getMapX() - currentMapCursorX);
			var yDist = Math.abs(enemyUnit.getMapY() - currentMapCursorY);
			if (xDist + yDist > enemyMov + endRange) continue;

			var inEnemyRange = false;

			// Check if enemy is able to reach our player unit
			this._simulator2.startSimulationWeapon(enemyUnit, enemyMov, startRange, endRange);
			var arr = this._simulator2.getSimulationWeaponIndexArray();
			for (var i = 0; i < arr.length; i++) {
				if (goalIndex == arr[i]) {
					//root.log(enemyUnit.getName() + " in weapon range");
					inEnemyRange = true;
					break;
				}
			}	

			if (!inEnemyRange && (xDist + yDist <= enemyMov)) {
				arr = this._simulator2.getSimulationIndexArray();
				for (var i = 0; i < arr.length; i++) {
					if (goalIndex == arr[i]) {
						//root.log(enemyUnit.getName() +  " in movement range");
						inEnemyRange = true;
						break;
					}
				}
			}

			// if enemy is in range, prepare the target line between the enemy and the cursor position
			if (inEnemyRange) {
				var arrow = defineObject(BaseShape,
				{
					_figure: null,
					_color: 0xff00000,		// colour of arrow
					_alpha: 128,			// opacity of arrow
					_strokeColor: 0xff0000,	// colour of arrow outline
					_strokeAlpha: 128,		// opacity of arrow outline
					_strokeWeight: 3,		// width of arrow outline


					
					setupShape: function(x1, y1, x2, y2) {
						if (ConfigItem.TargetingLines.getFlagValue() == 0) {
							// Straight lines with arrowheads

							// calculating the slope and unit vector [dx, dy]...
							var dx = x2-x1;
							var dy = y2-y1;
							var dist = Math.sqrt(dx*dx + dy*dy);
							if (dist == 0) return; // prevent division by zero errors
							dx /= dist;
							dy /= dist;

							// change these parameters to change the shape of the arrow
							var lineStartingPoint = 16; 					// how far away from the originating unit to start drawing the line
							var arrowBaseLength = Math.max(24, dist - 32); 	// how far away from the destination unit to start drawing the arrowhead
							var arrowTipLength = Math.max(32, dist - 24); 	// how far away from the destination unit to draw the tip of the arrowhead
							var arrowWidth = 8; 							// width of the arrowhead

							// calculating the polygon points...
							var mid = GraphicsFormat.MAPCHIP_WIDTH / 2;
							var lineBaseX = x1+mid + lineStartingPoint*dx;
							var lineBaseY = y1+mid + lineStartingPoint*dy;
							var arrowBaseX = x1+mid + arrowBaseLength*dx;
							var arrowBaseY = y1+mid + arrowBaseLength*dy;
							var arrowTipX = x1+mid + arrowTipLength*dx;
							var arrowTipY = y1+mid + arrowTipLength*dy;

							// create polygon
							var canvas = root.getGraphicsManager().getCanvas();
							this._figure = canvas.createFigure();
							this._figure.beginFigure(lineBaseX, lineBaseY);
							this._figure.addLine(arrowBaseX, arrowBaseY);
							this._figure.addLine(arrowBaseX + arrowWidth/2*dy, arrowBaseY - arrowWidth/2*dx);
							this._figure.addLine(arrowTipX, arrowTipY);
							this._figure.addLine(arrowBaseX - arrowWidth/2*dy, arrowBaseY + arrowWidth/2*dx);
							this._figure.addLine(arrowBaseX, arrowBaseY);
							this._figure.addLine(lineBaseX, lineBaseY);
							this._figure.endFigure();
						} else if (ConfigItem.TargetingLines.getFlagValue() == 1) {
							// Hyperbolic curved lines without arrowheads

							// calculating the slope and unit vector [dx, dy]...
							var deltaX = x2-x1;
							var deltaY = y2-y1;
							var dist = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
							if (dist == 0) return; // prevent division by zero errors
							var dx = deltaX / dist;
							var dy = deltaY / dist;

							// change these parameters to change the shape of the arrow
							var yThreshold = -64;							// When negative, line will curve "up" even if the enemy is below the player
																			// We like to set it negative because "upwards" curving arcs seem more aesthetic
							var xThreshold = 0;
							var curviness = Math.max(0, dist); 				// higher curviness = taller "arc"
							var curviness2 = Math.max(0, dist);				// if curviness2 is different than curviness, then the curve will have variable thickness

							// some graphic issues appear when the two units are too close together because beziers tend to 'overshoot' the endpoints
							if (dist < 96) { 
								curviness = 0;
								curviness2 = 0;
							}

							// Flip some curves because "upwards" curving arcs seem more aesthetic
							if (deltaX < xThreshold && deltaY >= yThreshold || deltaX >= xThreshold && deltaY < yThreshold) {
								curviness *= -1;
								curviness2 *= -1;
							}

							// calculating the polygon points...
							var mid = GraphicsFormat.MAPCHIP_WIDTH / 2;
							var lineBaseX = x1+mid;
							var lineBaseY = y1;
							var lineEndX = x2+mid;
							var lineEndY = y2+mid;

							if (curviness > 0) {
								if (deltaX > xThreshold && deltaY > yThreshold) {
									lineEndX = x2;
									lineEndY = y2;
								} else if (deltaX > xThreshold && deltaY < yThreshold) {
									lineEndX = x2;
									lineEndY = y2+GraphicsFormat.MAPCHIP_HEIGHT;
								} else if (deltaX < xThreshold && deltaY > yThreshold) {
									lineEndX = x2+GraphicsFormat.MAPCHIP_WIDTH;
									lineEndY = y2;
								} else if (deltaX < xThreshold && deltaY < yThreshold) {
									lineEndX = x2+GraphicsFormat.MAPCHIP_WIDTH;
									lineEndY = y2+GraphicsFormat.MAPCHIP_HEIGHT;
								}
							} else {
								lineBaseX = x1+mid;
								lineBaseY = y1+mid;
							}



							// create polygon
							var canvas = root.getGraphicsManager().getCanvas();
							this._figure = canvas.createFigure();
							this._figure.beginFigure(lineBaseX, lineBaseY);
							this._figure.addBezier(lineBaseX, lineBaseY, (lineEndX + lineBaseX)/2 - curviness/2*dy, (lineEndY + lineBaseY)/2 - curviness/2*dx, lineEndX, lineEndY);
							this._figure.addBezier(lineEndX, lineEndY, (lineEndX + lineBaseX)/2 - curviness2/2*dy, (lineEndY + lineBaseY)/2 - curviness2/2*dx, lineBaseX, lineBaseY);
							this._figure.endFigure();
						}
					},
					
					drawShape: function() {
						var canvas = root.getGraphicsManager().getCanvas();
						var isStrokeFirst = false;
						
						canvas.setStrokeInfo(this._strokeColor, this._strokeAlpha, this._strokeWeight, isStrokeFirst);
						canvas.setFillColor(this._color, this._alpha);
						canvas.drawFigure(0, 0, this._figure);
					}
				});
				// e for enemy, c for cursor
				var ex = LayoutControl.getPixelX(enemyUnit.getMapX());
				var ey = LayoutControl.getPixelY(enemyUnit.getMapY());
				var cx = currentMapCursorX * GraphicsFormat.MAPCHIP_WIDTH - root.getCurrentSession().getScrollPixelX();
				var cy = currentMapCursorY * GraphicsFormat.MAPCHIP_HEIGHT - root.getCurrentSession().getScrollPixelY();
				//MARKYJOE EDIT
				if (typeof MarkyJoeScroller != "undefined") {
					var scrollDistX = this._mapCursor._scroller._goalX - this._mapCursor._scroller._prevX;
					var scrollDistY = this._mapCursor._scroller._goalY - this._mapCursor._scroller._prevY;
					ex -= scrollDistX;
					ey -= scrollDistY;
					cx -= scrollDistX;
					cy -= scrollDistY;
				}
				//END EDIT
				arrow.setupShape(ex, ey, cx, cy);
				this._targetLineArray.appendObject(arrow);
			}
		}
	}
}

var alias2 = MapSequenceArea._drawArea;
MapSequenceArea._drawArea = function() {

	var x, y;
	var lastDirection;

	if (this._movementLocus.cource.length > 0) {

		x = this._mapCursor.getX() * GraphicsFormat.MAPCHIP_WIDTH - root.getCurrentSession().getScrollPixelX();
		y = this._mapCursor.getY() * GraphicsFormat.MAPCHIP_HEIGHT - root.getCurrentSession().getScrollPixelY();


		// カーソル部分の方から移動軌跡の描画を行う
		for (var index = this._movementLocus.cource.length - 1; index >= 0; index--) {
			if (index === this._movementLocus.cource.length - 1) {// 最初のループは矢印の終点部分の描画
				this._drawEndPointMovementLocus(x, y, this._movementLocus.cource[index]);
			} else {// 2度目以降のループは矢印の中間部分の描画
				this._drawLineMovementLocus(x, y, this._movementLocus.cource[index + 1], this._movementLocus.cource[index]);
			}

			// 次のループで描画すべきx, y座標を設定する
			switch (this._movementLocus.cource[index]) {
				case DirectionType.LEFT:
					x += GraphicsFormat.MAPCHIP_WIDTH;// 左向きに進むという事は右側に戻れば良い
					break;
				case DirectionType.TOP:
					y += GraphicsFormat.MAPCHIP_HEIGHT;
					break;
				case DirectionType.RIGHT:
					x -= GraphicsFormat.MAPCHIP_WIDTH;
					break;
				case DirectionType.BOTTOM:
					y -= GraphicsFormat.MAPCHIP_HEIGHT;
					break;
				default:
					break;
			};	
			if (lastDirection == null) {
				lastDirection = this._movementLocus.cource[index];
			}	
		}
		
		// 最後に矢印の始点部分の描画
		this._drawStartPointMovementLocus(x, y, this._movementLocus.cource[0]);
	}

	// 矢印の上に移動対象ユニットのキャラチップを被せる
	this._drawMoveUnit(lastDirection);

	alias2.call(this);
};

/*
 * 移動軌跡の終点(矢印先端部分)を描画する
 *
 * @param 
 *  x (number): 描画するマスのx座標(画面左上を(0,0)とした場合の座標)
 *  y (number): 描画するマスのy座標(画面左上を(0,0)とした場合の座標)
 *  direction_id (number): 移動方向のID(0が左方向、1が上方向、2が右方向、3が下方向)
 *
 * @note
 *  direction_idが想定外の値だった場合は何も描画を行いません
 */
MapSequenceArea._drawEndPointMovementLocus = function(x, y, direction_id) {
	if (!ConfigItem.MovementArrow.isDisabled()) {
		switch (direction_id) {
			case DirectionType.LEFT: // 左方向の矢印描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.EndPoint.Left[0], MOVE_ALLOW_SETTING.EndPoint.Left[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			case DirectionType.TOP: // 上方向の矢印描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.EndPoint.Up[0], MOVE_ALLOW_SETTING.EndPoint.Up[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			case DirectionType.RIGHT: // 右方向の矢印描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.EndPoint.Right[0], MOVE_ALLOW_SETTING.EndPoint.Right[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			case DirectionType.BOTTOM: // 下方向の矢印描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.EndPoint.Down[0], MOVE_ALLOW_SETTING.EndPoint.Down[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			default:
				break;
		};
	};
};

/*
 * 始点、終点以外の移動軌跡を描画する
 *
 * @param 
 *  x (number): 描画するマスのx座標(画面左上を(0,0)とした場合の座標)
 *  y (number): 描画するマスのy座標(画面左上を(0,0)とした場合の座標)
 *  next_id (number): 描画マスから見て次のマスの方向ID(0が左方向、1が上方向、2が右方向、3が下方向)
 *  direction_id (number): 移動方向のID(0が左方向、1が上方向、2が右方向、3が下方向)
 *
 * @note
 *  direction_idとnext_idの値の組み合わせが想定外だった場合は何も描画を行いません
 */
MapSequenceArea._drawLineMovementLocus = function(x, y, next_id, direction_id) {
	if (!ConfigItem.MovementArrow.isDisabled()) {
		if ((direction_id === DirectionType.LEFT && next_id === DirectionType.BOTTOM) || (direction_id === DirectionType.TOP && next_id === DirectionType.RIGHT)) {// 下方向-右方向曲線を描画
			this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.Line.DownRight[0], MOVE_ALLOW_SETTING.Line.DownRight[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
		} else if ((direction_id === DirectionType.LEFT && next_id === DirectionType.TOP) || (direction_id === DirectionType.BOTTOM && next_id === DirectionType.RIGHT)) {// 上方向-右方向曲線を描画
			this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.Line.UpRight[0], MOVE_ALLOW_SETTING.Line.UpRight[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
		} else if ((direction_id === DirectionType.RIGHT && next_id === DirectionType.TOP) || (direction_id === DirectionType.BOTTOM && next_id === DirectionType.LEFT)) {// 上方向-左方向曲線を描画
			this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.Line.UpLeft[0], MOVE_ALLOW_SETTING.Line.UpLeft[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
		} else if ((direction_id === DirectionType.TOP && next_id === DirectionType.LEFT) || (direction_id === DirectionType.RIGHT && next_id === DirectionType.BOTTOM)) {// 下方向-左方向曲線を描画
			this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.Line.DownLeft[0], MOVE_ALLOW_SETTING.Line.DownLeft[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
		} else if ((direction_id === DirectionType.LEFT && next_id === DirectionType.LEFT) || (direction_id === DirectionType.RIGHT && next_id === DirectionType.RIGHT)) {// 横直線を描画
			this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.Line.Horizontal[0], MOVE_ALLOW_SETTING.Line.Horizontal[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
		} else if ((direction_id === DirectionType.TOP && next_id === DirectionType.TOP) || (direction_id === DirectionType.BOTTOM && next_id === DirectionType.BOTTOM)) {// 縦直線を描画
			this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.Line.Vertical[0], MOVE_ALLOW_SETTING.Line.Vertical[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
		}
	};
};

/*
 * 移動軌跡の始点を描画する
 *
 * @param 
 *  x (number): 描画するマスのx座標(画面左上を(0,0)とした場合の座標)
 *  y (number): 描画するマスのy座標(画面左上を(0,0)とした場合の座標)
 *  next_id (number): 描画マスから見て次のマスの方向ID(0が左方向、1が上方向、2が右方向、3が下方向)
 *
 * @note
 *  next_idが想定外の値だった場合は何も描画を行いません
 */
MapSequenceArea._drawStartPointMovementLocus = function(x, y, next_id) {
	if (!ConfigItem.MovementArrow.isDisabled()) {
		switch (next_id) {
			case DirectionType.LEFT: // 左方向の始点描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.StartPoint.Left[0], MOVE_ALLOW_SETTING.StartPoint.Left[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			case DirectionType.TOP: // 上方向の始点描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.StartPoint.Up[0], MOVE_ALLOW_SETTING.StartPoint.Up[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			case DirectionType.RIGHT: // 右方向の始点描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.StartPoint.Right[0], MOVE_ALLOW_SETTING.StartPoint.Right[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			case DirectionType.BOTTOM: // 下方向の始点描画
				this._allowPic.drawParts(x, y, MOVE_ALLOW_SETTING.StartPoint.Down[0], MOVE_ALLOW_SETTING.StartPoint.Down[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
				break;
			default:
				break;
		};
	};
};

/*
 * コース作成の必要が無いので削除している
 */
MapSequenceArea._startMove = function() {
	var cource;
	var x = this._mapCursor.getX();
	var y = this._mapCursor.getY();
	var isCurrentPos = this._targetUnit.getMapX() === x && this._targetUnit.getMapY() === y;

	this._parentTurnObject.setCursorSave(this._targetUnit);

	// ユニットの現在位置を選択した場合は移動不要
	if (isCurrentPos) {
		this._simulateMove.noMove(this._targetUnit);
		this._playMapUnitSelectSound();
		return true;
	}
	else {
		// コースを作成して移動開始
		//cource = this._simulateMove.createCource(this._targetUnit, x, y, this._unitRangePanel.getSimulator());
		//this._simulateMove.startMove(this._targetUnit, cource);
		this._simulateMove.startMove(this._targetUnit, this._movementLocus.cource);
	}

	return false;
};

/*
 * CourceBuilder.updateMovementLocus
 *  目的地までの最適なコースを選出し、movementLocusの情報を更新する
 *  デフォルトのコース選出のロジックとは異なり直前で選出されたコースをなるべく辿るようにする
 *
 * @param
 *  unit (object): 対象ユニットのオブジェクト
 *  goalIndex (number): 目的地のマップインデックス
 *  newCourceSimulator (object): 新しいコースを選出するためのsimulator
 *  addCourceSimulator (object): 追加コースを選出するためのsimulator
 *  movementLocus (object): 更新対象のmovementLocus
 *
 */
CourceBuilder.updateMovementLocus = function(unit, goalIndex, newCourceSimulator, addCourceSimulator, movementLocus) {

	var addMovePoint, addCource, reverseCount;
	var newCource = CourceBuilder.createLongCource(unit, goalIndex, newCourceSimulator);
	var newMovePoint = newCourceSimulator.getSimulationMovePoint(goalIndex);

	newCourceSimulator.resetSimulationMark();

	// 既存コースが作成されていなければ
	// 追加コースの検証を行う事はせずに
	// movementLocusを新しいコースに更新する
	if (movementLocus.cource.length === 0) {
		this._setMovementLocus(newCource, newMovePoint, goalIndex, movementLocus);
		return ;
	}

	// 既存コースを逆戻りすれば辿り着けるのかどうかを調べる
	if ((reverseCount = this._getReverseCount(movementLocus, goalIndex)) > 0) {

		// movementLocus.courceの要素数を参照するのは、万が一上手く動作しなかった時にエラー落ちしないようにするため
		for (var index = reverseCount - 1; index >= 0 && movementLocus.cource.length > 0; index--) {
			movementLocus.cource.pop();
		}

		// movePointはnewMovePointと同じ値になる（どちらも移動消費コストが最低のコースなので同じ値になるはず）
		this._setMovementLocus(movementLocus.cource, newMovePoint, goalIndex, movementLocus);
		return ;
	}

	// 追加コースの検証を行う
	addCource = CourceBuilder.createLongCource(unit, goalIndex, addCourceSimulator);
	addMovePoint = addCourceSimulator.getSimulationMovePoint(goalIndex) + movementLocus.movePoint;
	addCourceSimulator.resetSimulationMark();

	// 追加コースが移動不能か、新しいコースの方が移動コストが少なければ
	// movementLocusを新しいコースに更新する
	if (addCource.length === 0 || newMovePoint < addMovePoint) {
		this._setMovementLocus(newCource, newMovePoint, goalIndex, movementLocus);
		return;
	}

	// movementLocusを追加コースに更新する
	addCource = movementLocus.cource.concat(addCource);
	this._setMovementLocus(addCource, addMovePoint, goalIndex, movementLocus);
};

/*
 * CourceBuilder._getReverseCount
 *  既存のコースのゴールから何マス逆走すれば今回のゴール地点に辿り着くのか調べる
 *
 * @param
 *  movementLocus (object): 既存コース情報が入ったmovementLocus
 *  goalIndex (number): 今回のゴールのマップインデックス
 *
 * @return
 *  reverseCount (number): 逆走するのに必要なマス数、辿り着けなかったり逆走の必要が無い場合は0が返る
 */
CourceBuilder._getReverseCount = function(movementLocus, goalIndex) {

	var goalX = CurrentMap.getX(goalIndex);
	var goalY = CurrentMap.getY(goalIndex);
	var prevX = movementLocus.goalX;
	var prevY = movementLocus.goalY;
	var reverseCount = 0;

	for (var index = movementLocus.cource.length - 1; index >= 0; index--) {
		reverseCount++;
		switch (movementLocus.cource[index]) {
			case DirectionType.LEFT:
				prevX++;
				break;
			case DirectionType.TOP:
				prevY++;
				break;
			case DirectionType.RIGHT:
				prevX--;
				break;
			case DirectionType.BOTTOM:
				prevY--;
				break;
		};

		if (prevX === goalX && prevY === goalY) {
			return reverseCount;
		}		
	}

	return 0;
};

/*
 * CourceBuilder._setMovementLocus
 *  movementLocusを更新する
 *
 * @param
 *  cource (object): 新しく算出されたコース
 *  movePoint (number): 新しく算出されたゴールまでの消費移動コスト
 *  index (number): 新しいゴール地点のマップインデックス
 *  movementLocus (object): 更新対象のmovementLocus
 *
 */
CourceBuilder._setMovementLocus = function(cource, movePoint, index, movementLocus) {

	movementLocus.cource = cource;
	movementLocus.movePoint = movePoint;
	movementLocus.goalX = CurrentMap.getX(index);
	movementLocus.goalY = CurrentMap.getY(index);
};

var alias_cache = CacheControl.clearCache;
CacheControl.clearCache = function() {
	alias_cache.call(this);
	this._allowPic = null;
};

CacheControl._allowPic = null;
CacheControl.getAllowPic = function() {
	var pic;

	if (!this._allowPic) {
		pic = root.getMaterialManager().createImage(MOVE_ALLOW_SETTING.Folder, MOVE_ALLOW_SETTING.Image);
		this._allowPic = this._createImageCache(pic);
	} else if (!this._allowPic.picCache.isCacheAvailable()) {
		pic = root.getMaterialManager().createImage(MOVE_ALLOW_SETTING.Folder, MOVE_ALLOW_SETTING.Image);
		this._setImageCache(pic, this._allowPic.picCache);		
	}

	return this._allowPic.picCache;
};

CacheControl._createImageCache = function(pic) {
	var picCache, height, width, cache;

	if (!pic) {
		return null;
	}

	height = pic.getHeight();
	width = pic.getWidth();

	cache = {};
	cache.picCache = root.getGraphicsManager().createCacheGraphics(width, height);
	this._setImageCache(pic, cache.picCache);

	return cache;
};

CacheControl._setImageCache = function(pic, picCache) {
	var graphicsManager = root.getGraphicsManager();
	graphicsManager.setRenderCache(picCache);
	pic.draw(0, 0);
	graphicsManager.resetRenderCache();
};

// Functions for drawing polygons (for targeting lines)
// based on highlevel-canvas.js from the official plugins
var BaseShape = defineObject(BaseObject,
{
	setupShape: function() {
	},
	
	moveShape: function() {
	},
	
	drawShape: function() {
	}
});

})();




//config-movepoint.js
/*--------------------------------------------------------------------------
  
  Add the entry of "Display of Moving Points" on the configuration screen.
  
  Usage:
  Describe
  
  {movePointVisible: 0}
  
  etc. on "Data Settings/Config/Script/Env Parameters".
  If it's not set, it's off as default.
  
  Author:
  SapphireSoft
  http://srpgstudio.com/
  
  History:
  2018/08/19 Released
  
--------------------------------------------------------------------------*/

/*
20200416: Updated this flag to show the remaining movement points of the unit instead.
The code to do so is in "Show Movement.js"

- McMagister
*/

(function() {

	var alias1 = ConfigWindow._configureConfigItem;
	ConfigWindow._configureConfigItem = function(groupArray) {
		alias1.call(this, groupArray);
		
		groupArray.appendObject(ConfigItem.MovePointVisible);
		groupArray.appendObject(ConfigItem.GhostPreview);
		groupArray.appendObject(ConfigItem.MovementArrow);
		groupArray.appendObject(ConfigItem.TargetingLines);
	};
	
	ConfigItem.MovePointVisible = defineObject(BaseConfigtItem,
	{
		isDisabled: function() {
			return this.getFlagValue() == 1;
		},

		selectFlag: function(index) {
			root.getExternalData().env.movePointVisible = index;
		},
		
		getFlagValue: function() {
			if (typeof root.getExternalData().env.movePointVisible !== 'number') {
				return 1;
			}
		
			return root.getExternalData().env.movePointVisible;
		},
		
		getFlagCount: function() {
			return 2;
		},
		
		getConfigItemTitle: function() {
			return 'Display Movement Pts';
		},
		
		getConfigItemDescription: function() {
			return 'Display the remaining movement points when moving unit';
		}
	});

	
	ConfigItem.GhostPreview = defineObject(BaseConfigtItem,
	{
		isDisabled: function() {
			return this.getFlagValue() == 1;
		},

		selectFlag: function(index) {
			root.getExternalData().env.GhostPreview = index;
		},
		
		getFlagValue: function() {
			if (typeof root.getExternalData().env.GhostPreview !== 'number') {
				return 1;
			}
		
			return root.getExternalData().env.GhostPreview;
		},
		
		getFlagCount: function() {
			return 2;
		},
		
		getConfigItemTitle: function() {
			return 'Display Ghost Preview';
		},
		
		getConfigItemDescription: function() {
			return 'Display Ghost Preview when moving unit';
		}
	});
	
	ConfigItem.MovementArrow = defineObject(BaseConfigtItem,
	{
		isDisabled: function() {
			return this.getFlagValue() == 1;
		},

		selectFlag: function(index) {
			root.getExternalData().env.MovementArrow = index;
		},
		
		getFlagValue: function() {
			if (typeof root.getExternalData().env.MovementArrow !== 'number') {
				return 1;
			}
		
			return root.getExternalData().env.MovementArrow;
		},
		
		getFlagCount: function() {
			return 2;
		},
		
		getConfigItemTitle: function() {
			return 'Display Movement Arrow';
		},
		
		getConfigItemDescription: function() {
			return 'Display Movement Arrow when moving unit';
		}
	});

	ConfigItem.TargetingLines = defineObject(BaseConfigtItem,
	{
		isDisabled: function() {
			return this.getFlagValue() == 2;
		},

		selectFlag: function(index) {
			root.getExternalData().env.TargetingLines = index;
		},
		
		getFlagValue: function() {
			if (typeof root.getExternalData().env.TargetingLines !== 'number') {
				return 2;
			}
		
			return root.getExternalData().env.TargetingLines;
		},
		
		getFlagCount: function() {
			return 3;
		},
		
		getConfigItemTitle: function() {
			return 'Display Targeting Lines';
		},
		
		getConfigItemDescription: function() {
			return 'Displays enemies that can target your unit';
		},

		getObjectArray: function() {
			return ["Arrow", "Curved", "Off"];
		}
	});
})();
