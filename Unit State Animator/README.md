# Unit State Animator Plugin

The Unit State Animator is a plugin that serves as a framework to display icons over enemy units without the use of states, like for example the exclamation icons that appear over enemy units with effective weapons or high critical rates in the later Fire Emblems.  Or the support levels of your allies, or to display which units have talk events.  Or display an icon for your custom implementation of pair-up, or display an icon over bosses... the list goes on and on.

![Warning Markers][1]

[1]: Example.png

*Example of a script using this plugin to draw icons over units with critical hit warnings and talk events.  It is by Repeat, check it out! https://github.com/TheRepeat/SRPG-Studio/tree/master/Repeat%27s%20QoL%20Enhancement%20Pack/Markers*

SRPG Studio has a limit of 6 states per unit, and having states that have no purpose but display an icon is an inefficient use of them.  

Note that by itself, the file `!unit-state-animator.js` does nothing, but any other plugin can make use of this one to display icons.


## How to Use this Plugin ##

A simple plugin that draws a shield over Boss units is included.  (boss-indicator.js).  This will draw a shield over any unit with a customer parameter of { boss:true }.

### 1. Define Icons ###
To use the Unit State Animator in your own plugin, first, you should define your icons using the below template.  All options are required.

```javascript
var BOSS_ICON = {
    isRuntime: true,
    id: 0,
    xSrc: 9,
    ySrc: 4
};
```

**isRuntime:** A boolean value.  Set to *false* if the file uses a custom imported asset or *true* if it is using a default Runtime asset.

**id:** The ID number of the file you added to the icon folder in SRPG Studio, or 0 if using the runtime icons.  If you haven't already, in SRPG Studio, go into Tools > Options > Data and check "Display id next to data name".

**xSrc and ySrc:** The positions of the particular icon you want to use WITHIN the file. Note that the first row and column are index 0.  Below is an example image (made by Repeat) that shows how xSrc and ySrc are determined.  Note this applies both to runtime and non-runtime icon files.

![xSrc ySrc Example][2]

[2]: helper.png


### 2. Extend `UnitStateAnimator._updateIconByUnit()` ###

Then, your plugin will extend the functionality of `UnitStateAnimator._updateIconByUnit()` to add your icon.  By using an alias, multiple plugins can extend this same function.  An example implementation is below:

```javascript
// Delegate the responsibility of rendering the custom parameters to UnitStateAnimator
var alias = UnitStateAnimator._updateIconByUnit;
UnitStateAnimator._updateIconByUnit = function (unit) {
    alias.call(this, unit);

    if (unit.custom.boss) {
        var BOSS_ICON_HANDLE = root.createResourceHandle(BOSS_ICON.isRuntime, BOSS_ICON.id, 0, BOSS_ICON.xSrc, BOSS_ICON.ySrc);
        this._addIcon(unit, BOSS_ICON_HANDLE, UnitStateAnimType.FIXED, 10, 24);
        this._iconArray.push(this._icon);
    }
};

```
Note the line `this._addIcon(unit, BOSS_ICON_HANDLE, UnitStateAnimType.FIXED, 10, 24);`  While the first two parameters are more or less fixed, the remaining three are optional parameters can determine what type of animation to use, and where to place it.  The UnitStateAnimType has three possible values:

```javascript
var UnitStateAnimType = {
    BOUNCE: 0,  // bounce up and down, the default
    BLINK: 1,   // blink, like SRPG Studio's states
    FIXED: 2    // don't move at all
};
```

The remaining parameters are the x offset and y offset of the icon (with respect to the unit).  x=0 is the horizontal center of the unit while y=0 is the top.  (this is because the default animation is a bouncing icon over the center-top of the unit).


### 3. Call `UnitStateAnimator.updateIcons()` whenever the icon should be added or removed ###

Finally, call `UnitStateAnimator.updateIcons()` whenever there is a need to add or remove an icon.  In the example below, the icons are updated when the map is first loaded.

```javascript
var alias2 = CurrentMap.prepareMap;
CurrentMap.prepareMap = function() {
    alias2.call(this);

    UnitStateAnimator.updateIcons();
};
```

## Scripts that use the Unit State Animator ##

https://github.com/TheRepeat/SRPG-Studio/tree/master/Repeat%27s%20QoL%20Enhancement%20Pack/Markers

Enemy Range Display (enemy-range-mark-v2.js and enemy-range-object-v2.js)

Boss Indicator (boss-inidicator.js)


# LICENSE

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

