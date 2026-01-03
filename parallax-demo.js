(function() {

/* keep parallax clock up to date */
function updateClocks() {
    const now = new Date();

    const timeElement = document.querySelector(".parallax-clock-time");
    const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
    if (timeElement.innerText !== time) {
        timeElement.innerText = time;
    }

    const dateElement = document.querySelector(".parallax-clock-date");
    const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    if (dateElement.innerText !== date) {
        dateElement.innerText = date;
    }
}
updateClocks();
window.setInterval(updateClocks, 1000);

})();

