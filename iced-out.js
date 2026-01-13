(function() {

//  TODO: Consider defining with LitJS + component for bottom bar

/*
     TODO: Add dialog control - something like this

    import { LitElement, html } from 'lit';
    import { customElement } from 'lit/decorators.js';
    import { ref, createRef } from 'lit/directives/ref.js';

    @customElement('example-app')
    export class ExampleApp extends LitElement {
      dialogRef = createRef<HTMLDialogElement>();

      render() {
        return html`
          <h1>lit-modal-portal Dialog Example</h1>
          <button @click=${() => this.dialogRef.value?.showModal()}>Show Dialog</button>
          <dialog ${ref(this.dialogRef)}>
            <p>This is the dialog</p>
            <button @click=${() => this.dialogRef.value?.close()}>Close Dialog</button>
          </dialog>
        `;
      }
    }
*/

/*
 * CAROUSELS
 */

/* helper functions for snapping carousel scroll targets */
function scrollToNearestXScrollTarget(scrollContainer, behavior, offset) {
    if (!behavior) { behavior = 'smooth'; }
    const nearest = nearestXScrollTarget(scrollContainer, offset);
    if (nearest === null) {
        return;
    }
    scrollContainer.scrollTo({
        left: nearest.offsetLeft,
        top: nearest.offsetTop,
        behavior: behavior
    });
}
function nearestXScrollTarget(scrollContainer, offset) {
    const scrollTargets = Array.from(scrollContainer.children);
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

/* event handlers for permanent carousel navigation controls */
function getCarouselByDataAttr(button) {
    const carouselAttr = button.dataset.carousel;
    if (!carouselAttr) {
        throw Error("slide navigation button is missing a data-carousel attribute (should specify an element selector to obtain the associated carousel)");
    }
    const carousel = document.querySelector(carouselAttr);
    if (!carousel) {
        throw Error("click handler for navigation button could not find the carousel specified by the data-carousel attribute (is it a valid selector?)");
    }
    return carousel;
}
function carouselNavigate(carousel, next) {
    carousel.dispatchEvent(new CustomEvent('clear-snap-timeout', { detail: { } }));
    scrollToNearestXScrollTarget(carousel, 'smooth', next ? 1 : -1);
}
for (const previousSlideButton of document.querySelectorAll(".carousel-previous-button")) {
    const carousel = getCarouselByDataAttr(previousSlideButton);
    previousSlideButton.addEventListener('click', function() {
        carouselNavigate(carousel, false);
    });
    carousel.addEventListener('scroll', function() {
        previousSlideButton.disabled = !(nearestXScrollTarget(carousel)?.previousElementSibling);
    }, { passive: true });
    previousSlideButton.disabled = !(nearestXScrollTarget(carousel)?.previousElementSibling);
}
for (const nextSlideButton of document.querySelectorAll(".carousel-next-button")) {
    const carousel = getCarouselByDataAttr(nextSlideButton);
    nextSlideButton.addEventListener('click', function() {
        carouselNavigate(carousel, true);
    });
    carousel.addEventListener('scroll', function() {
        nextSlideButton.disabled = !(nearestXScrollTarget(carousel)?.nextElementSibling);
    }, { passive: true });
    nextSlideButton.disabled = !(nearestXScrollTarget(carousel)?.nextElementSibling);
}

/* browser bugs mean snapping scroll container can sometimes get stuckin a non-snapped position;
 * attach a handler to the scroll event that forces an eventual snap */
for (const carousel of document.querySelectorAll(".snapping-carousel")) {
    let snapTimeout = null;
    carousel.addEventListener('scroll', function() {
        if (snapTimeout !== null) {
            clearTimeout(snapTimeout);
        }
        snapTimeout = window.setTimeout(() => {
            scrollToNearestXScrollTarget(carousel);
        }, 750);
    }, { passive: true });
    carousel.addEventListener('clear-snap-timeout', () => {
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

/*
 * SCROLL CONTAINERS
 */

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

/*
 * SELECT INPUTS
 */

/* allow styling based on the width of select elements, by setting the length of the currently-selected item as an attribute */
for (const select of document.querySelectorAll("select:not([multiple])")) {
    select.style.setProperty('--selected-text-length', select.options[select.selectedIndex].text.length);
    select.addEventListener('change', function() {
        select.style.setProperty('--selected-text-length', select.options[select.selectedIndex].text.length);
    });
}

})();

