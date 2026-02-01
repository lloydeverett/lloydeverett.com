(function() {

const body = document.querySelector("body");

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

/* allow styling based on the width of select elements, by setting the length of the currently-selected item as an attribute */
for (const select of document.querySelectorAll("select:not([multiple])")) {
    select.style.setProperty('--selected-text-length', select.options[select.selectedIndex].text.length);
    select.addEventListener('change', function() {
        select.style.setProperty('--selected-text-length', select.options[select.selectedIndex].text.length);
    });
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

/* play/pause button */
for (const button of document.querySelectorAll(".play-pause-toggle")) {
    button.addEventListener('click', function() {
        body.classList.toggle("parallax-paused");
        document.dispatchEvent(new CustomEvent('update-parallax-state', { detail: { } }));
    });
}

})();

