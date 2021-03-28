class StateListener {
    constructor(name, handler, target) {
        this.name= name
        this.handler= handler
        this.target= target

        console.assert(target instanceof Element, target)
    }

    listen() {
        this.target.addEventListener(this.name, this.handler)
    }
    deafen() {
        this.target.removeEventListener(this.name, this.handler)
    }

}


export {
    StateListener
}