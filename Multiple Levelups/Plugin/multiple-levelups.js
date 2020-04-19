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

ExperienceCalculator.getBestExperience = function(unit, exp) {
    exp = Math.floor(exp * this._getExperienceFactor(unit));
    
    if (exp < 0) {
        exp = 0;
    }
    
    return exp;
};

ExperienceControl._addExperience = function(unit, getExp) {
    var exp;
    var baselineExp = this._getBaselineExperience();
    var levelsGained = 0;

    // Add the current unit exp and the obtain exp.
    exp = unit.getExp() + getExp; 
    
    if (exp >= baselineExp) {
        while (exp >= baselineExp) {
            // If exceed the reference value, 1 level up.
            unit.setLv(unit.getLv() + 1);
            if (unit.getLv() >= Miscellaneous.getMaxLv(unit)) {
                // If reached maximum level, the exp is 0.
                exp = 0;
            }
            else {
                // Exp falls less than the maximum exp by subtracting the maximum exp.
                exp -= baselineExp;
            }
            levelsGained++;
        }
        
        unit.setExp(exp);
    }
    else {
        unit.setExp(exp);
        
        // If no level up, return false.
        return 0;
    }

    return levelsGained;
};

ExperienceControl.obtainExperience = function(unit, getExp) {
    var growthArray;
    var levelsGained = this._addExperience(unit, getExp);
    
    if (levelsGained <= 0) {
        return null;
    }
    
    if (unit.getUnitType() === UnitType.PLAYER) {
        growthArray = this._createGrowthArray(unit, levelsGained);
    }
    else {
        growthArray = unit.getClass().getPrototypeInfo().getGrowthArray(unit.getLv());
    }
    
    return growthArray;
};

ExperienceControl._createGrowthArray = function(unit, levelsGained) {
    var i, n;
    var count = ParamGroup.getParameterCount();
    var growthArray = [];
    var weapon = ItemControl.getEquippedWeapon(unit);
    
    for (i = 0; i < count; i++) {
        // Calculate the growth value (or the growth rate).
        n = ParamGroup.getGrowthBonus(unit, i) + ParamGroup.getUnitTotalGrowthBonus(unit, i, weapon);
        n = n * levelsGained;
        
        // Set the rise value.
        growthArray[i] = this._getGrowthValue(n);
    }
    
    return growthArray;
};

ExperienceNumberView.setExperienceNumberData = function(unit, exp) {
    var max;
		
    if (exp === 1) {
        // Even if the obtained exp is 1, play the sound.
        max = 0;
    }
    else {
        max = 2;
    }
    
    this._unit = unit;
    this._exp = exp;
    
    this._balancer = createObject(SimpleBalancer);
    this._balancer.setBalancerInfo(0, 99999);
    this._balancer.setBalancerSpeed(10);
    this._balancer.startBalancerMove(exp);
    
    this._counter = createObject(CycleCounter);
    this._counter.setCounterInfo(max);
    this.changeCycleMode(ExperienceNumberMode.COUNT);
}