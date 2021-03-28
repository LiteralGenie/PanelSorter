class BaseState {
    constructor(app) {
        this.app= app
        this.listeners= [] // array of StateListener instances
    }

    addListeners(lst=this.listeners) {
        lst.forEach(l => l.listen())
    }
    removeListeners(lst=this.listeners) {
        lst.forEach(l => l.deafen())
    }

    cleanup(){}
    transition(NewState, ...args) {
        this.cleanup()
        this.removeListeners()
        this.app.state= new NewState(...args)
        this.app.state.addListeners()
    }
}


export {
    BaseState
}