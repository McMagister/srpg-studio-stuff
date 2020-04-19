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
 * This file ovewrites engine functions to call function from EnemyRange
 * 
 * Edits by McMagister
 * 2020-04-19: Draw cursor icons over the marked enemy units
 */

(function() {

//Draws the enemy range
var mk01 = MapLayer.drawMapLayer;
MapLayer.drawMapLayer = function() {
    mk01.call(this);
    EnemyRange.drawRange();
}

//Marks an enemy unit every time it is selected
//Marking an already marked unit will unmark it
var mk02 = MapEdit._selectAction;
MapEdit._selectAction = function(unit) {
    var result = MapEditResult.NONE;
    if (unit!=null && unit.getUnitType()==UnitType.ENEMY) {
        EnemyRange.markUnit(unit);
    }
    else {
        result = mk02.call(this, unit);
    }

    return result;
}

//Updates the enemy range when a enemy or ally unit ends its move
var mk03 = SimulateMove._endMove;
SimulateMove._endMove = function(unit) {
    mk03.call(this, unit);
    if (unit.getUnitType()!=UnitType.PLAYER) {
        EnemyRange.updateRange();
    }
}

//Updates the enemy range when an unit dies
var mk04 = DamageControl.setDeathState;
DamageControl.setDeathState = function(unit) {
    mk04.call(this, unit);
    EnemyRange.updateRange();
}

//Updates the enemy range when a player unit ends its move
var mk05 = PlayerTurn.moveTurnCycle;
PlayerTurn.moveTurnCycle = function() {
    var oldMode, newMode;
    oldMode = this.getCycleMode();
    result = mk05.call(this);
    newMode = this.getCycleMode();

    if (oldMode==PlayerTurnMode.UNITCOMMAND && newMode==PlayerTurnMode.MAP) {
        //Going from UNITCOMMAND to MAP means that the unit finished its move, so we update the enemy range
        EnemyRange.updateRange();
    }

    return result;
}

//Updates the enemy range when a reinforcement enemy unit spawns
var mk06 = ReinforcementChecker.moveTurnChangeCycle;
ReinforcementChecker.moveTurnChangeCycle = function() {
    result = mk06.call(this);
    if (result==MoveResult.END) {
        EnemyRange.updateRange();
    }

    return result;    
}

var mk07 = RetryControl.register;
RetryControl.register = function() {
	EnemyRange.updateRange();
	mk07.call(this);
}

// Draw cursor icons over the marked enemy units
var mk08 = MapLayer.drawUnitLayer;
MapLayer.drawUnitLayer = function() {
	mk08.call(this);

    var enemyList = EnemyList.getAliveList();

    var pic = root.queryUI('focuscursor');
    var pic2 = root.queryUI('lockoncursor');
    var width = UIFormat.MAPCURSOR_WIDTH / 2;
    var height = UIFormat.MAPCURSOR_HEIGHT;

    for (var e = 0; e < enemyList.getCount(); e++) {
        var enemyUnit = enemyList.getData(e);
        if (enemyUnit.custom.mark != null && enemyUnit.custom.mark) {
            pic.drawParts(
                enemyUnit.getMapX() * GraphicsFormat.MAPCHIP_WIDTH - root.getCurrentSession().getScrollPixelX(),
                (enemyUnit.getMapY()-1) * GraphicsFormat.MAPCHIP_HEIGHT - root.getCurrentSession().getScrollPixelY(),
                0, 0, width, height);
            pic2.drawParts(
                enemyUnit.getMapX() * GraphicsFormat.MAPCHIP_WIDTH - root.getCurrentSession().getScrollPixelX(),
                enemyUnit.getMapY() * GraphicsFormat.MAPCHIP_HEIGHT - root.getCurrentSession().getScrollPixelY(),
                0, 0, width, height);
        }
    }
};

})();