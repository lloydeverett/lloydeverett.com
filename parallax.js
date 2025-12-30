
/* the styles load animations with "animation-play-state: paused;" so that, in this script,
 * we can use JS to step through the animations at a slow, fixed framerate (rather than using
 * the native CSS animation speed set by the browser, which is likely overkill for an
 * animation that only needs to advance slowly)
 */

const frameInterval = 1000 / 24; /* 24fps */

const animations = Array.from(document.querySelectorAll('.parallax'))
                       .flatMap(e => e.getAnimations());

function startInterval() {
    return setInterval(function() {
        for (const animation of animations) {
            animation.currentTime += frameInterval;
            if (animation.currentTime > animation.effect.getComputedTiming().duration) {
                animation.currentTime = 0;
            }
        }
    }, frameInterval);
}

let intervalId = startInterval();

// ensure we pause the annimation when the page is not visible (e.g. browser is minimised)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(intervalId);
        intervalId = null;
    } else {
        intervalId = startInterval();
    }
});

