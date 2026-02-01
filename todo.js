(function() {

const { LitElement, html, css } = window.lit;

class TodoSurface extends LitElement {
    static properties = {
        todoTitle: { type: String, attribute: 'todo-title' },
        done: { type: Boolean, attribute: 'done' }
    };
    constructor() {
        super();
        this._id = crypto.randomUUID();
        this.style.display = "contents";
    }
    createRenderRoot() {
        return this; // no shadow DOM
    }
    render() {
        return html`
            <div class="surface layout-vertical layout-justify-center layout-align-center layout-contain md-obey-max-height obey-max-width obey-width obey-height" style="--width: 100%; height: 100%; --max-height: 45rem; --max-width: 70rem;">
                <attach-snapping-carousel-navigation-left class="md"></attach-snapping-carousel-navigation-left>
                <attach-snapping-carousel-navigation-right class="md"></attach-snapping-carousel-navigation-right>
                <h1>${this.todoTitle}</h1>
            </div>
        `;
        /*
             TODO: Support for "done" attribute - starting with e.g.
            <div class="themed-checkbox h1">
                <input disabled type="checkbox" id="${this._id}" name="${this._id}" ?checked="${this.done}">
                <label class="no-user-select" for="${this._id}" >${this.todoTitle}</label>
            </div>
        */
    }
}
customElements.define('todo-surface', TodoSurface);

})();

