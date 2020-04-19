/**
Copyright (c) 2020 McMagister

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function() {

var DirectionType = {
	LEFT: 0,
	TOP: 1,
	RIGHT: 2,
	BOTTOM: 3,
	NULL: 4,
	COUNT: 4,
	SELECT: 5 // New DirectionType for unit select animation
};


MapSequenceArea._getDefaultDirection = function() {
	return DirectionType.SELECT; // Default is DirectionType.RIGHT
};

UnitRenderer.drawCharChip = function(x, y, unitRenderParam) {
	var dx, dy, dxSrc, dySrc;
	var directionArray = [4, 1, 2, 3, 0, 5]; // updated with new value in index 5 corresponding to DirectionType.SELECT, and value is also '5' corresonding to the fifth row of the charchip (0-based index)
	var handle = unitRenderParam.handle;
	var width = GraphicsFormat.CHARCHIP_WIDTH;
	var height = GraphicsFormat.CHARCHIP_HEIGHT;
	var xSrc = handle.getSrcX() * (width * 3);
	var ySrc = handle.getSrcY() * (height * 5);
	var pic = this._getGraphics(handle, unitRenderParam.colorIndex);
	
	if (pic === null) {
		return;
	}
	
	dx = Math.floor((width - GraphicsFormat.MAPCHIP_WIDTH) / 2);
	dy = Math.floor((height - GraphicsFormat.MAPCHIP_HEIGHT) / 2);
	dxSrc = unitRenderParam.animationIndex;
	dySrc = directionArray[unitRenderParam.direction];
	
	pic.setAlpha(unitRenderParam.alpha);
	pic.setDegree(unitRenderParam.degree);
	pic.setReverse(unitRenderParam.isReverse);
	pic.drawStretchParts(x - dx, y - dy, width, height, xSrc + (dxSrc * width), ySrc + (dySrc * height), width, height);
};

MapSequenceArea._drawMoveUnit = function() {
	var x, y;
	var unitRenderParam = StructureBuilder.buildUnitRenderParam();
	unitRenderParam.direction = this._targetUnit.getDirection();
	unitRenderParam.animationIndex = MapLayer.getAnimationIndexFromUnit(this._targetUnit);
	unitRenderParam.isScroll = true;

	x = this._targetUnit.getMapX() * GraphicsFormat.MAPCHIP_WIDTH;
	y = this._targetUnit.getMapY() * GraphicsFormat.MAPCHIP_HEIGHT;

	UnitRenderer.drawScrollUnit(this._targetUnit, x, y, unitRenderParam);

	var x2, y2;
	x2 = root.getCurrentSession().getMapCursorX() * GraphicsFormat.MAPCHIP_WIDTH;
	y2 = root.getCurrentSession().getMapCursorY() * GraphicsFormat.MAPCHIP_HEIGHT;
	unitRenderParam.alpha = 128;
	UnitRenderer.drawScrollUnit(this._targetUnit, x2, y2, unitRenderParam);
};

var drawAreaAlias = MapSequenceArea._drawArea;
MapSequenceArea._drawArea = function() {
	this._drawMoveUnit();
	drawAreaAlias.call(this);
};

})(); 