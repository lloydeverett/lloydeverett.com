(function() {

/* the styles load animations with "animation-play-state: paused;" so that, in this script,
 * we can use JS to step through the animations at a slow, fixed framerate (rather than using
 * the native CSS animation speed set by the browser, which is likely overkill for an
 * animation that only needs to advance slowly)
 */

const frameInterval = 1000 / 24; /* 24fps */
let intervalId = null;

function advanceTime(interval) {
    const animations = Array.from(document.querySelectorAll('.parallax'))
                           .flatMap(e => e.getAnimations());
    for (const animation of animations) {
        animation.currentTime += interval;
        while (animation.currentTime > animation.effect.getComputedTiming().duration) {
            animation.currentTime -= animation.effect.getComputedTiming().duration;
        }
        while (animation.currentTime < 0) {
            animation.currentTime += animation.effect.getComputedTiming().duration;
        }
    }
}

function startInterval() {
    return setInterval(function() {
        advanceTime(frameInterval);
    }, frameInterval);
}

function updateAnimationState() {
    if (document.hidden || document.body.classList.contains('parallax-paused')) {
        clearInterval(intervalId);
        intervalId = null;
    } else if (intervalId === null) {
        intervalId = startInterval();
    }
}

updateAnimationState();

// ensure we pause the annimation when the page is not visible (e.g. browser is minimised)
document.addEventListener('visibilitychange', () => {
    updateAnimationState();
});

window.parallax = {
    updateAnimationState: updateAnimationState,
    advanceTime: advanceTime
};

})();

