import {Option} from "./option.js";


class BaseMenu {
    constructor() {
        this.options= []
        this.html_elem= document.createElement("ul")
        this.html_elem.classList.add("menu")

		this.html_elem.style.display= 'block'
		this.html_elem.style.position= 'absolute'
    }

    addOption(option) {
        this.options.push(option)
        this.html_elem.append(option.html_elem)
        return this
    }

    createOption(text, callback) {
        let opt= new Option(text, callback, this)
        this.addOption(opt)
        return this
    }
}


export {BaseMenu}