/**
Copyright (c) 2020 Goinza, McMagister

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

/**
 * Script by Goinza
 * 
 * Edits by McMagister
 * 2020-04-19: Draw outline over the enemy attack range
 */


// Range Outline image and folder
var RANGE_OUTLINE = {
	Folder: 'Edge',         	// Material folder name
	Image: 'AttackEdge.png',	// Image file name
	Edge: {
        Left:   [GraphicsFormat.MAPCHIP_WIDTH * 0, GraphicsFormat.MAPCHIP_HEIGHT * 0],
        Down:   [GraphicsFormat.MAPCHIP_WIDTH * 1, GraphicsFormat.MAPCHIP_HEIGHT * 0],
        Right:  [GraphicsFormat.MAPCHIP_WIDTH * 2, GraphicsFormat.MAPCHIP_HEIGHT * 0],
        Up:     [GraphicsFormat.MAPCHIP_WIDTH * 3, GraphicsFormat.MAPCHIP_HEIGHT * 0]	
    }
};

(function() {
    // Image cache
    var alias_cache = CacheControl.clearCache;
    CacheControl.clearCache = function() {
        alias_cache.call(this);
        this._outlinePic = null;
    };

    CacheControl._outlinePic = null;
    CacheControl.getOutlinePic = function() {
        var pic;

        if (!this._outlinePic) {
            pic = root.getMaterialManager().createImage(RANGE_OUTLINE.Folder, RANGE_OUTLINE.Image);
            this._outlinePic = this._createImageCache(pic);
        } else if (!this._outlinePic.picCache.isCacheAvailable()) {
            pic = root.getMaterialManager().createImage(RANGE_OUTLINE.Folder, RANGE_OUTLINE.Image);
            this._setImageCache(pic, this._outlinePic.picCache);		
        }

        return this._outlinePic.picCache;
    };

    CacheControl._createImageCache = function(pic) {
        var height, width, cache;

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
})();


//Object that controls the individual enemy range
var EnemyRange = {

    _rangeIndexArray: null, //Array of arrays of index
    _leftOutlineArray: null, // Array of lines for the outline of the enemy range
    _downOutlineArray: null,
    _rightOutlineArray: null,
    _upOutlineArray: null,
    _outlinePic: null,

    //Marks an unmarked unit or unmarks a marked unit
    markUnit: function(unit) {
        if (unit.custom.mark!=null) {
            unit.custom.mark = !unit.custom.mark;
        }
        else {
            unit.custom.mark = true;
        }
        this.updateRange();
    },

    //Get the marked status of the unit
    isMarked: function(unit) {
        return unit.custom.mark;
    },

    //Updates the enemy range (_rangeIndexArray)
    updateRange: function() {
        this._outlinePic = CacheControl.getOutlinePic();

        this._rangeIndexArray = [];
        this._leftOutlineArray = [];
        this._downOutlineArray = [];
        this._rightOutlineArray = [];
        this._upOutlineArray = [];

        var simulator = root.getCurrentSession().createMapSimulator();
        var enemyList = EnemyList.getAliveList();
        var unit, marked, attackRange, isWeapon;
        var mapWidth = root.getCurrentSession().getCurrentMapInfo().getMapWidth();
        var mapHeight = root.getCurrentSession().getCurrentMapInfo().getMapHeight();

        for (var i=0; i<enemyList.getCount(); i++) {
            unit = enemyList.getData(i);
            marked = unit.custom.mark!=null ? unit.custom.mark : false;
            if (marked && !unit.isInvisible()) {
                attackRange = UnitRangePanel.getUnitAttackRange(unit);
                isWeapon = attackRange.endRange !== 0;		
                if (isWeapon) {
                    simulator.startSimulationWeapon(unit, attackRange.mov, attackRange.startRange, attackRange.endRange);
                    this._addToArray(simulator.getSimulationIndexArray());
                    this._addToArray(simulator.getSimulationWeaponIndexArray());
                }            
            }
        }

        this._rangeIndexArray = this._sortAndDeduplicate(this._rangeIndexArray);
        root.log(this._rangeIndexArray);

        // Add outlines (_outlineArray)
        // At this stage, assume the _rangeIndexArray is sorted and has no duplicates
        for (var i = 0; i < this._rangeIndexArray.length; i++) {
            var index = this._rangeIndexArray[i];

            // add left outline if there is no tile directly to the left
            if (index % mapWidth == 0 ||
                !this._contains(this._rangeIndexArray, index-1)) {
                this._leftOutlineArray.push(index);
            }

            // add right outline if there is no tile directly to the right
            if (index % mapWidth == mapWidth-1 ||
                !this._contains(this._rangeIndexArray, index+1)) {
                this._rightOutlineArray.push(index);
            }

            // add top outline if there is no tile directly above
            if (Math.floor(index / mapWidth) % mapHeight == 0 ||
                !this._contains(this._rangeIndexArray, index-mapWidth)) {
                this._upOutlineArray.push(index);
            }

            // add bottom outline if there is no tile directly below
            if (Math.floor(index / mapWidth) % mapHeight == mapHeight-1 ||
                !this._contains(this._rangeIndexArray, index+mapWidth)) {
                this._downOutlineArray.push(index);
            }
        }
    },

    //Draws the enemy range (_rangeIndexArray)
    drawRange: function() {
        if (this._rangeIndexArray!=null) {
            root.drawFadeLight(this._rangeIndexArray, this._getColor(), this._getAlpha());            
        }

        // draw the range outlines 
        var session = root.getCurrentSession();
        if (session == null) return;
        var mapInfo = session.getCurrentMapInfo();
        var mapWidth = mapInfo.getMapWidth();
        var dx = session.getScrollPixelX();
        var dy = session.getScrollPixelY();
        var x, y;

        if (!this._outlinePic) {
            return;
        }

        // draw left outline
        for (var i = 0; i < this._leftOutlineArray.length; i++) {
            x = this._leftOutlineArray[i] % mapWidth * GraphicsFormat.MAPCHIP_WIDTH - dx;
            y = Math.floor(this._leftOutlineArray[i] / mapWidth) * GraphicsFormat.MAPCHIP_HEIGHT - dy;
            this._outlinePic.drawParts(x, y, RANGE_OUTLINE.Edge.Left[0], RANGE_OUTLINE.Edge.Left[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
        }

        // draw right outline
        for (var i = 0; i < this._rightOutlineArray.length; i++) {
            x = this._rightOutlineArray[i] % mapWidth * GraphicsFormat.MAPCHIP_WIDTH - dx;
            y = Math.floor(this._rightOutlineArray[i] / mapWidth) * GraphicsFormat.MAPCHIP_HEIGHT - dy;
            this._outlinePic.drawParts(x, y, RANGE_OUTLINE.Edge.Right[0], RANGE_OUTLINE.Edge.Right[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
        }

        // draw top outline
        for (var i = 0; i < this._upOutlineArray.length; i++) {
            x = this._upOutlineArray[i] % mapWidth * GraphicsFormat.MAPCHIP_WIDTH - dx;
            y = Math.floor(this._upOutlineArray[i] / mapWidth) * GraphicsFormat.MAPCHIP_HEIGHT - dy;
            this._outlinePic.drawParts(x, y, RANGE_OUTLINE.Edge.Up[0], RANGE_OUTLINE.Edge.Up[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
        }

        // draw bottom outline
        for (var i = 0; i < this._downOutlineArray.length; i++) {
            x = this._downOutlineArray[i] % mapWidth * GraphicsFormat.MAPCHIP_WIDTH - dx;
            y = Math.floor(this._downOutlineArray[i] / mapWidth) * GraphicsFormat.MAPCHIP_HEIGHT - dy;
            this._outlinePic.drawParts(x, y, RANGE_OUTLINE.Edge.Down[0], RANGE_OUTLINE.Edge.Down[1], GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT);
        }
    },

    // Add the indexArray elements to the _rangeIndexArray
    // Does not purge duplicates
    _addToArray: function(indexArray) {
        for (var i = 0; i < indexArray.length; i++) {
            this._rangeIndexArray.push(indexArray[i]);
        }
    },

    // Checks if the index is in the array
    // https://stackoverflow.com/a/237176
    _contains: function(arr, obj) {
        var i = arr.length;
        while (i--) {
           if (arr[i] === obj) {
               return true;
           }
        }
        return false;
    },

    // sorts and removes duplicates from array
    // https://stackoverflow.com/a/21445415
    _sortAndDeduplicate: function(arr) {
        arr.sort(function(a, b) {
            return a - b;
        });
        
        var last_i;
        for (var i = 0; i < arr.length; i++) {
            if ((last_i = this._lastIndexOf(arr, arr[i])) !== i) {
                arr.splice(i + 1, last_i - i);
            }
        }
        return arr;
    },

    // implement Array.lastIndexOf() since SRPG Studio's JavaScript version doesn't support it...
    // https://stackoverflow.com/a/31815706
    _lastIndexOf: function(arr, value) {
        for (var i = arr.length; i > 0; i--) {
            if (arr[i] == value) return i;
        }
        return -1;
    },

    _getColor: function() {
        return root.getMetaSession().global.enemyRange!=null ? root.getMetaSession().global.enemyRange.color : 0xaa0000;
    },

    _getAlpha: function() {
        return root.getMetaSession().global.enemyRange!=null ? root.getMetaSession().global.enemyRange.alpha : 32;
    }

}