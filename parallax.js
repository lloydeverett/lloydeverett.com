(function() {

/* the styles load animations with "animation-play-state: paused;" so that, in this script,
 * we can use JS to step through the animations at a slow, fixed framerate (rather than using
 * the native CSS animation speed set by the browser, which is likely overkill for an
 * animation that only needs to advance slowly)
 */

const frameInterval = 1000 / 24; /* 24fps */

function startInterval() {
    return setInterval(function() {
        const animations = Array.from(document.querySelectorAll('.parallax'))
                               .flatMap(e => e.getAnimations());
        for (const animation of animations) {
            animation.currentTime += frameInterval;
            if (animation.currentTime > animation.effect.getComputedTiming().duration) {
                animation.currentTime = 0;
            }
        }
    }, frameInterval);
}

let intervalId = startInterval();

function updateAnimationState() {
    console.log('update');
    if (document.hidden || document.body.classList.contains('parallax-paused')) {
        clearInterval(intervalId);
        intervalId = null;
    } else if (intervalId === null) {
        intervalId = startInterval();
    }
}

// ensure we pause the annimation when the page is not visible (e.g. browser is minimised)
document.addEventListener('visibilitychange', () => {
    updateAnimationState();
});

// custom event for manually triggering update
document.addEventListener('update-parallax-state', () => {
    updateAnimationState();
});

})();

