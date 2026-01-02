const body = document.querySelector("body");

(function() {

/* if has query parameter parallax-demo, remove most of the DOM elements, style and early exit script */
if (new URLSearchParams(window.location.search).has("parallax-demo")) {
    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach(child => {
        if (!child.classList.contains('parallax')) {
            child.remove();
        }
    });
    document.documentElement.style = "border-top: 1px solid #404040; --parallax-img-speed-multiplier: 0.5;";
    return;
}

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

/* update clock display */
function updateClocks() {
    const clocks = document.querySelectorAll(".clock-text");
    const now = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
    for (const clock of clocks) {
        clock.innerText = now;
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

})();

