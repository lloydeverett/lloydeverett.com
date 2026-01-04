(function() {

const body = document.querySelector("body");

/* allow scrolling through horizontal scroll containers via vertical mouse wheel */
const scrollContainers = document.querySelectorAll(".scroll-container-horizontal");
let preventingHorizontalScrollTimer = null;
for (const scrollContainer of scrollContainers) {
    scrollContainer.addEventListener("wheel", function(e) {
        if (Math.abs(e.deltaX) > 0) {
            clearTimeout(preventingHorizontalScrollTimer);
            preventingHorizontalScrollTimer = window.setTimeout(() => {
                preventingHorizontalScrollTimer = null;
            }, 4000);
            return;
        }
        if (preventingHorizontalScrollTimer === null && Math.abs(e.deltaY) > 0) {
            e.preventDefault();
            scrollContainer.scrollLeft += e.deltaY;
        }
    });
}

/* keep toolbar clock up to date */
function updateClocks() {
    const clocks = document.querySelectorAll(".toolbar-clock-text");
    const now = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
    for (const clock of clocks) {
        if (clock.innerText !== now) {
            clock.innerText = now;
        }
    }
}
updateClocks();
window.setInterval(updateClocks, 1000);

/* helper function to obtain current parallax theme */
function currentParallaxTheme() {
    for (className of body.classList) {
        if (className.startsWith("parallax-theme-")) {
            return className.substring("parallax-theme-".length);
        }
    }
    return null;
}

/* parallax theme select: populate elements */
const parallaxThemeSelect = document.querySelector("#parallax-theme-select");
const documentStyles = getComputedStyle(document.documentElement);
for (const propertyName of documentStyles) {
    if (!propertyName.startsWith("--parallax-theme-name-")) {
        continue;
    }
    const themeName = documentStyles.getPropertyValue(propertyName).trim();
    const option = document.createElement('option');
    option.value = themeName;
    option.textContent = themeName;
    if (themeName === currentParallaxTheme()) {
        option.selected = true;
    }
    parallaxThemeSelect.appendChild(option);
}

/* parallax theme select: apply selection */
parallaxThemeSelect.addEventListener('change', function() {
    body.classList.toggle("parallax-theme-" + currentParallaxTheme(), false);
    body.classList.toggle("parallax-theme-" + parallaxThemeSelect.value, true);
});

/* floating toolbar toggle */
const floatToolbarInput = document.querySelector("#float-toolbar");
floatToolbarInput.checked = false;
floatToolbarInput.addEventListener("change", function() {
    body.classList.toggle("floating-toolbars", this.checked);
});

/* allow styling based on the width of select elements, by setting the length of the currently-selected item as an attribute */
for (const select of document.querySelectorAll("select:not([multiple])")) {
    select.style.setProperty('--selected-text-length', select.options[select.selectedIndex].text.length);
    select.addEventListener('change', function() {
        select.style.setProperty('--selected-text-length', select.options[select.selectedIndex].text.length);
    });
}

/* browser bugs mean snapping scroll container can sometimes get stuck in a non-snapped position;
 * attach a handler to the scroll event that forces an eventual snap */
function scrollToNearestXScrollTarget(scrollContainer, scrollTargets, behavior) {
    if (!behavior) { behavior = 'smooth'; }
    const nearest = nearestXScrollTarget(scrollContainer, scrollTargets);
    if (nearest === null || nearest.scrollLeft === scrollContainer.scrollLeft) {
        return;
    }
    scrollContainer.scrollTo({
        left: nearest.offsetLeft,
        top: nearest.offsetTop,
        behavior: behavior
    });
}
function nearestXScrollTarget(scrollContainer, scrollTargets) {
    if (scrollTargets.length === 0) {
        return null;
    }
    let minDistance = Math.abs(scrollTargets[0].offsetLeft - scrollContainer.scrollLeft);
    let elem = scrollTargets[0];
    for (let i = 1; i < scrollTargets.length; i++) {
        let distance = Math.abs(scrollTargets[i].offsetLeft - scrollContainer.scrollLeft);
        if (distance < minDistance) {
            minDistance = distance;
            elem = scrollTargets[i];
        }
    }
    return elem;
}
for (const scrollContainer of document.querySelectorAll(".snapping-carousel")) {
    let snapTimeout = null;
    scrollContainer.addEventListener('scroll', () => {
        if (snapTimeout !== null) {
            clearTimeout(snapTimeout);
        }
        snapTimeout = window.setTimeout(() => {
            scrollToNearestXScrollTarget(scrollContainer, Array.from(scrollContainer.children));
        }, 750);
    }, { passive: true });
}

})();

