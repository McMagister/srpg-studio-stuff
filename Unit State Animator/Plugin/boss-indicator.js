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

/**
 * Draws a shield icon over enemy unit with custom parameter { boss:true }
 * Similar to the GBA Fire Emblems
 * 
 * Makes use of the Unit State Animator
 */

(function () {

    var BOSS_ICON = {
        isRuntime: true,
        id: 0,
        xSrc: 9,
        ySrc: 4
    };

    // Delegate the responsibility of rendering the custom parameters to UnitStateAnimator
    // This code is an example of how to display an extra icon that will always appear regardless of other icons the unit has
    var alias = UnitStateAnimator._updateIconByUnit;
    UnitStateAnimator._updateIconByUnit = function (unit) {
        alias.call(this, unit);

        var temp = this._icon;
        this._icon = null;
        if (unit.custom.boss) {
            var BOSS_ICON_HANDLE = root.createResourceHandle(BOSS_ICON.isRuntime, BOSS_ICON.id, 0, BOSS_ICON.xSrc, BOSS_ICON.ySrc);
            this._addIcon(unit, BOSS_ICON_HANDLE, UnitStateAnimType.FIXED, 10, 24);
            this._iconArray.push(this._icon);
        }
        this._icon = temp;
    };

    var alias2 = CurrentMap.prepareMap;
    CurrentMap.prepareMap = function() {
        alias2.call(this);

        UnitStateAnimator.updateIcons();
    };

})();