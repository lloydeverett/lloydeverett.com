(function() {

const { LitElement, html, css } = window.lit;

//  TODO: component for bottom bar

/*
 * DROPDOWNS
 */

class DropdownControl extends LitElement {
    static styles = css`
        .control-wrapper {
            position: relative;
            display: inline;
            width: 100%;
        }
        .control-container {
            display: contents;
        }
        .dropdown {
            position: absolute;
            top: 100%;
            z-index: 1000;
            display: none;
            min-width: 200px;
            max-width: 90vw;
            margin: -0.25rem;
            margin-top: 0;
            overflow: visible;
        }
        .dropdown.open {
            display: block;
        }
        .dropdown.align-left {
            left: 0;
            right: auto;
        }
        .dropdown.align-right {
            right: 0;
            left: auto;
        }
        .dropdown-content {
            padding: 0.25rem;
            overflow-y: auto;
            max-height: 400px;
        }
    `;
    static properties = {
        isOpen: { type: Boolean },
        overflowBreakpoint: { type: String, attribute: "overflow-breakpoint" },
        _alignRight: { type: Boolean, state: true },
        _overflowing: { type: Boolean, state: true }
    };
    constructor() {
        super();
        this.isOpen = false;
        this._alignRight = false;
        this._overflowing = false;
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    render() {
        return html`
            <div class="control-wrapper">
                <span>${this._overflowing ? "overflowing" : "not"}</span>
                <div class="control-container" @click="${this.toggleDropdown}">
                    <slot name="control"></slot>
                </div>
                <div
                    class="dropdown ${this.isOpen ? 'open' : ''} ${this._alignRight ? 'align-right' : 'align-left'}"
                    @click="${(e) => e.stopPropagation()}"
                >
                    <div class="dropdown-content">
                        <slot name="content"></slot>
                    </div>
                </div>
            </div>
        `;
    }
    toggleDropdown() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            // Use requestAnimationFrame to ensure DOM is updated before measuring
            requestAnimationFrame(() => {
                this.checkDropdownAlignment();
                this.attachClickOutsideListener();
            });
        } else {
            this.removeClickOutsideListener();
        }
    }
    checkDropdownAlignment() {
        const dropdown = this.shadowRoot.querySelector('.dropdown');
        if (!dropdown) return;

        const wrapper = this.shadowRoot.querySelector('.control-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const dropdownWidth = dropdown.offsetWidth;

        // Calculate if left-aligned dropdown would overflow
        const leftAlignedRight = wrapperRect.left + dropdownWidth;
        const wouldOverflowRight = leftAlignedRight > viewportWidth;

        // Calculate if right-aligned dropdown would overflow
        const rightAlignedLeft = wrapperRect.right - dropdownWidth;
        const wouldOverflowLeft = rightAlignedLeft < 0;

        // Prefer left alignment unless it overflows and right alignment fits
        this._alignRight = wouldOverflowRight && !wouldOverflowLeft;
    }
    handleResize() {
        if (this.isOpen) {
            this.checkDropdownAlignment();
        }
        if (this.overflowBreakpoint) {
            this._overflowing = getComputedStyle(document.documentElement).getPropertyValue('--breakpoint').includes(this.overflowBreakpoint + ';');
        } else {
            this._overflowing = false;
        }
    }
    attachClickOutsideListener() {
        document.addEventListener('click', this.handleClickOutside);
    }
    removeClickOutsideListener() {
        document.removeEventListener('click', this.handleClickOutside);
    }
    handleClickOutside(event) {
        if (!this.contains(event.target)) {
            this.isOpen = false;
        }
    }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeClickOutsideListener();
        window.removeEventListener('resize', this.handleResize);
        this.isOpen = false;
    }
}
customElements.define('dropdown-control', DropdownControl);

/*
 * CAROUSELS
 */

// helper functions for snapping carousel scroll targets
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

// carousel custom element class
class SnappingCarousel extends LitElement {
    static properties = {
        _snapTimeout: { state: true },
        _observer: { state: true }
    };
    constructor() {
        super();
        this._snapTimeout = null;
    }
    createRenderRoot() {
        return this; // no shadow DOM
    }
    connectedCallback() {
        super.connectedCallback();

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        this.handleScroll = this.handleScroll.bind(this);
        this.addEventListener('scroll', this.handleScroll, { passive: true });

        this.handleClearSnapTimeout = this.handleClearSnapTimeout.bind(this);
        this.addEventListener('clear-snap-timeout', this.handleClearSnapTimeout);

        this._observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              // Update component state or trigger re-render
              this.handleChildrenChanged();
            }
          });
        });
        this._observer.observe(this, {
            childList: true,
            subtree: false
        });

        this.handleChildrenChanged();
    }
    firstUpdated() {
        this.handleChildrenChanged();
        this.scrollTo({
            left: 0,
            top: this.scrollTop,
            behavior: 'instant'
        });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this.handleResize);
        this.removeEventListener('scroll', this.handleScroll);
        this.removeEventListener('clear-snap-timeout', this.handleClearSnapTimeout);
        clearTimeout(this._snapTimeout);
        if (this._observer) {
            this._observer.disconnect();
        }
    }
    handleResize() {
        // it is possible to sometimes see scroll briefly become misaligned with scroll snap positions
        // during viewport resize on certain browsers; let's work around that
        scrollToNearestXScrollTarget(this, 'instant');
    }
    handleScroll() {
        // browser bugs mean snapping scroll container can sometimes get stuckin a non-snapped position;
        // this handler for the scroll event forces an eventual snap
        clearTimeout(this._snapTimeout);
        this._snapTimeout = window.setTimeout(() => {
            scrollToNearestXScrollTarget(this);
        }, 750);
    }
    handleChildrenChanged() {
        this.style.setProperty('--slides-count', this.children.length);
    }
    handleClearSnapTimeout() {
        clearTimeout(this._snapTimeout);
    }
}
customElements.define('snapping-carousel', SnappingCarousel);

// carousel slide custom element class
//  NOTE: doesn't actually achieve anything over <div>, but intent is clearer and leaves open the possibility of custom behaviour
class SnappingCarouselSlide extends LitElement {
    constructor() {
        super();
    }
    createRenderRoot() {
        return this; // no shadow DOM
    }
    connectedCallback() {
        super.connectedCallback();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
}
customElements.define('snapping-carousel-slide', SnappingCarouselSlide);

/*
 * CAROUSEL NAVIGATION
 */

// attached navigation custom element classes
function carouselNavigateRelativeToAncestor(button, next) {
    const slide = button.closest("snapping-carousel-slide");
    if (!slide) {
        throw Error("click handler for slide navigation button cannot find current carousel slide");
    }
    const adjacent = next ? slide.nextElementSibling : slide.previousElementSibling;
    if (!adjacent) {
        throw Error("click handler for slide navigation button cannot find adjacent carousel slide");
    }
    const carousel = button.closest("snapping-carousel");
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
class AttachSnappingCarouselNavigation extends LitElement {
    constructor() {
        super();
    }
    createRenderRoot() {
        return this; // no shadow DOM
    }
    connectedCallback() {
        super.connectedCallback();
        this.handleClick = this.handleClick.bind(this);
        this.addEventListener('click', this.handleClick);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('click', this.handleClick);
    }
}
class AttachSnappingCarouselNavigationLeft extends AttachSnappingCarouselNavigation {
    handleClick() {
        carouselNavigateRelativeToAncestor(this, false);
    }
}
customElements.define('attach-snapping-carousel-navigation-left', AttachSnappingCarouselNavigationLeft);
class AttachSnappingCarouselNavigationRight extends AttachSnappingCarouselNavigation {
    handleClick() {
        carouselNavigateRelativeToAncestor(this, true);
    }
}
customElements.define('attach-snapping-carousel-navigation-right', AttachSnappingCarouselNavigationRight);

/* permanent carousel navigation cuastom element classes */
function getCarouselBySelector(selectorValue) {
    const carousel = document.querySelector(selectorValue);
    if (!carousel) {
        throw Error("could not resolve the selector specified by the navigation button carousel attribute (is it a valid selector?)");
    }
    if (carousel.tagName !== "SNAPPING-CAROUSEL") {
        throw Error("selector specified by the navigation button carousel attribute resolves but does not point to a <snapping-carousel> element");
    }
    return carousel;
}
function carouselNavigate(carousel, next) {
    carousel.dispatchEvent(new CustomEvent('clear-snap-timeout', { detail: { } }));
    scrollToNearestXScrollTarget(carousel, 'smooth', next ? 1 : -1);
}
class CarouselAdjacentButton extends LitElement {
    static properties = {
        carousel: { type: String },
        _carousel: { state: true }
    };
    constructor() {
        super();
    }
    createRenderRoot() {
        return this; // no shadow DOM
    }
    connectedCallback() {
        super.connectedCallback();
        this._carousel = getCarouselBySelector(this.carousel);

        this.handleClick = this.handleClick.bind(this);
        this.addEventListener('click', this.handleClick);

        this.handleCarouselScroll = this.handleCarouselScroll.bind(this);
        this._carousel.addEventListener('scroll', this.handleCarouselScroll, { passive: true });

        this.handleCarouselScroll();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('click', this.handleClick);
        this._carousel.removeEventListener('scroll', this.handleCarouselScroll);
    }
}
class CarouselPreviousButton extends CarouselAdjacentButton {
    handleClick() {
        carouselNavigate(this._carousel, false);
    }
    handleCarouselScroll() {
        this.classList.toggle('disabled', !(nearestXScrollTarget(this._carousel)?.previousElementSibling));
    }
}
customElements.define('carousel-previous-button', CarouselPreviousButton);
class CarouselNextButton extends CarouselAdjacentButton {
    handleClick() {
        carouselNavigate(this._carousel, true);
    }
    handleCarouselScroll() {
        this.classList.toggle('disabled', !(nearestXScrollTarget(this._carousel)?.nextElementSibling));
    }
}
customElements.define('carousel-next-button', CarouselNextButton);

/*
 * SCROLL CONTAINERS
 */

// vertical scroll container custom element class
class ScrollContainerVertical extends LitElement {
    constructor() {
        super();
    }
    createRenderRoot() {
        return this; // no shadow DOM
    }
    connectedCallback() {
        super.connectedCallback();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
}
customElements.define('scroll-container-vertical', ScrollContainerVertical);

// horizontal scroll container custom element class
class ScrollContainerHorizontal extends LitElement {
    static properties = {
        _preventingHorizontalScrollTimer: { state: true }
    };
    constructor() {
        super();
    }
    createRenderRoot() {
        return this; // no shadow DOM
    }
    connectedCallback() {
        super.connectedCallback();
        this.handleWheel = this.handleWheel.bind(this);
        this.addEventListener("wheel", this.handleWheel);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("wheel", this.handleWheel);
        clearTimeout(this._preventingHorizontalScrollTimer);
        this._preventingHorizontalScrollTimer = null;
    }
    handleWheel(e) {
        // allow scrolling through horizontal scroll containers via vertical mouse wheel
        if (Math.abs(e.deltaX) > 0) {
            clearTimeout(this._preventingHorizontalScrollTimer);
            this._preventingHorizontalScrollTimer = window.setTimeout(() => {
                this._preventingHorizontalScrollTimer = null;
            }, 4000);
            return;
        }
        if (this._preventingHorizontalScrollTimer === null && Math.abs(e.deltaY) > 0) {
            e.preventDefault();
            this.scrollLeft += e.deltaY;
        }
    }
}
customElements.define('scroll-container-horizontal', ScrollContainerHorizontal);

})();

