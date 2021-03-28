class Command {
    constructor({name="no name"}={}){
        this.undo_func= null
        this.redo_func= null

        this.redo_args= []
        this.undo_args= []

        this.redo_output= null
        this.undo_output= null

        this.html_elem= document.createElement("div")
        this.html_elem.textContent= name
        this.name= name
    }

    // setters
    addUndo(func, ...args){
        console.log('undoing', this.name)
        this.undo_func= func
        this.undo_args= args
        return this
    }
    addRedo(func, ...args){
        this.redo_func= func
        this.redo_args= args
        return this
    }

    // command execution
    redo() {
        this.redoPre()
        this.redo_output= this.redo_func(...this.redo_args)
        this.redoPost()
    }
    undo() {
        this.undoPre()
        this.undo_output= this.undo_func(...this.undo_args)
        this.undoPost()
    }

    // hooks
    redoPre(){}
    redoPost(){}
    undoPre(){}
    undoPost(){}
}


export {Command}