class Option {
    constructor(text, callback, parent) {
        this.text= text
        this.callback= callback
        this.parent= parent

        // create html
        this.html_elem= document.createElement("li")
        this.html_elem.classList.add("option")

        // create text + callback
        this.html_elem.textContent= text
        this.html_elem.addEventListener("click", function(e) {
            callback(e)
            this.parent.html_elem.remove() // remove after click
        }.bind(this))

        // basic events
        this._initEvents()
    }

    _initEvents() {
        this.html_elem.addEventListener("mouseenter", e => this.html_elem.classList.add("active"))
        this.html_elem.addEventListener("mouseleave", e => this.html_elem.classList.remove("active"))
    }
}

export {Option}