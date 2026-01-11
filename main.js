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

/* helper functions for snapping carousel scroll targets */
function scrollToNearestXScrollTarget(scrollContainer, behavior, offset) {
    if (!behavior) { behavior = 'smooth'; }
    const scrollTargets = Array.from(scrollContainer.children);
    const nearest = nearestXScrollTarget(scrollContainer, scrollTargets, offset);
    if (nearest === null) {
        return;
    }
    scrollContainer.scrollTo({
        left: nearest.offsetLeft,
        top: nearest.offsetTop,
        behavior: behavior
    });
}
function nearestXScrollTarget(scrollContainer, scrollTargets, offset) {
    if (scrollTargets.length === 0) {
        return null;
    }
    if (!offset) {
        offset = 0;
    }
    let minDistance = Math.abs(scrollTargets[0].offsetLeft - scrollContainer.scrollLeft);
    let elemIndex = 0;
    for (let i = 1; i < scrollTargets.length; i++) {
        let distance = Math.abs(scrollTargets[i].offsetLeft - scrollContainer.scrollLeft);
        if (distance < minDistance) {
            minDistance = distance;
            elemIndex = i;
        }
    }
    elemIndex += offset;
    if (elemIndex < 0) {
        elemIndex = 0;
    } else if (elemIndex >= scrollTargets.length) {
        elemIndex = scrollTargets.length - 1;
    }
    return scrollTargets[elemIndex];
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

/* click handlers for attached carousel navigation controls */
function carouselNavigateRelativeToAncestor(button, next) {
    const slide = button.closest(".snapping-carousel-slide");
    if (!slide) {
        throw Error("click handler for slide navigation button cannot find current carousel slide");
    }
    const adjacent = next ? slide.nextElementSibling : slide.previousElementSibling;
    if (!adjacent) {
        throw Error("click handler for slide navigation button cannot find adjacent carousel slide");
    }
    const carousel = button.closest(".snapping-carousel");
    if (!carousel) {
        throw Error("click handler for slide navigation button cannot find associated carousel");
    }
    carousel.dispatchEvent(new CustomEvent('clear-snap-timeout', { detail: { } }));
    carousel.scrollTo({
        left: adjacent.offsetLeft,
        top: adjacent.offsetTop,
        behavior: 'smooth'
    });
}
for (const previousSlideButton of document.querySelectorAll(".attach-snapping-carousel-navigation-left")) {
    previousSlideButton.addEventListener('click', function() {
        carouselNavigateRelativeToAncestor(previousSlideButton, false);
    });
}
for (const nextSlideButton of document.querySelectorAll(".attach-snapping-carousel-navigation-right")) {
    nextSlideButton.addEventListener('click', function() {
        carouselNavigateRelativeToAncestor(nextSlideButton, true);
    });
}

/* click handlers for permanent carousel navigation controls */
function carouselNavigate(button, next) {
    const carouselAttr = button.dataset.carousel;
    if (!carouselAttr) {
        throw Error("navigation slide button is missing a data-carousel attribute (should specify an element selector to obtain the associated carousel)");
    }
    const carousel = document.querySelector(carouselAttr);
    if (!carousel) {
        throw Error("click handler for navigation button could not find the carousel specified by the data-carousel attribute (is it a valid selector?)");
    }
    carousel.dispatchEvent(new CustomEvent('clear-snap-timeout', { detail: { } }));
    scrollToNearestXScrollTarget(carousel, 'smooth', next ? 1 : -1);
}
for (const previousSlideButton of document.querySelectorAll(".carousel-previous-button")) {
    previousSlideButton.addEventListener('click', function() {
        carouselNavigate(previousSlideButton, false);
    });
}
for (const nextSlideButton of document.querySelectorAll(".carousel-next-button")) {
    nextSlideButton.addEventListener('click', function() {
        carouselNavigate(nextSlideButton, true);
    });
}

/* browser bugs mean snapping scroll container can sometimes get stuckin a non-snapped position;
 * attach a handler to the scroll event that forces an eventual snap */
for (const scrollContainer of document.querySelectorAll(".snapping-carousel")) {
    let snapTimeout = null;
    scrollContainer.addEventListener('scroll', () => {
        if (snapTimeout !== null) {
            clearTimeout(snapTimeout);
        }
        snapTimeout = window.setTimeout(() => {
            scrollToNearestXScrollTarget(scrollContainer);
        }, 750);
    }, { passive: false });
    scrollContainer.addEventListener('clear-snap-timeout', () => {
        // allow manually clearing the timeout
        clearTimeout(snapTimeout);
    });
}

/* also possible to sometimes see scroll briefly become misaligned with scroll snap positions during viewport resize on certain browsers;
 * let's work around that */
window.addEventListener('resize', function() {
    for (const scrollContainer of document.querySelectorAll(".snapping-carousel")) {
        scrollToNearestXScrollTarget(scrollContainer, 'instant');
    }
});

})();

