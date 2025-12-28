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

/* floating toolbar toggle */
document.querySelector("#float-toolbar").checked = true;
document.querySelector("#float-toolbar").addEventListener("change", function() {
    document.querySelector("body").classList.toggle("toolbar-floating", this.checked);
});

