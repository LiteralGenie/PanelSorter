class History {
    constructor(html_elem, {
        redo_list_elem=null, undo_list_elem=null,
    }={}) {
        this.html_elem= html_elem
        this.undo_history= new HistoryList({parent:this, html_elem:undo_list_elem, reverse:true})
        this.redo_history= new HistoryList({parent:this, html_elem:redo_list_elem})

        if(undo_list_elem == null) this.undo_history.html_elem.classList.add("undo")
        if(redo_list_elem == null) this.redo_history.html_elem.classList.add("redo")

        // clear undo history on new action (added to redo history)
        this.redo_history.pushPost= () => {
            this.undo_history.clear()
        }
    }

    redo() {
        if(this.undo_history.length > 0){
            let cmd= this.undo_history.pop()
            cmd.redo()
            this.redo_history.push(cmd)
        }
    }

    undo() {
        if(this.redo_history.length > 0){
            let cmd= this.redo_history.pop()
            cmd.undo()
            this.undo_history.push(cmd)
        }
    }
}

class HistoryList {
    constructor({
        parent=null, html_elem=null,
        reverse=false,
    }={}) {
        if(html_elem == null) {
            html_elem = document.createElement("div")
            html_elem.classList.add("history-list")
            if(parent) parent.html_elem.append(html_elem)
        }
        this.html_elem= html_elem
        this.parent= parent
        this.reverse= reverse // entries are ordered with oldest at the bottom, but if reverse is true, place the oldest html elements at top

        this.list= []
    }

    push(cmd) {
        this.pushPre()

        this.list.push(cmd)

        if(this.reverse) this.html_elem.append(cmd.html_elem)
        else this.html_elem.prepend(cmd.html_elem)

        this.pushPost()

        return this
    }

    pop() {
        this.popPre()

        let cmd= this.list.pop()
        this.html_elem.removeChild(cmd.html_elem)

        this.popPost()

        return cmd
    }

    get length() {
        return this.list.length
    }

    clear() {
        this.list.forEach(cmd => cmd.html_elem.remove())
        this.list= []
    }

    // hooks
    popPre() {}
    popPost() {}
    pushPre() {}
    pushPost() {}
}

export {
    History
}