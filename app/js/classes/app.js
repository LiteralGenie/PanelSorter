import {Contour} from "./components/contour.js"
import {IdleState} from "./states/idle_state.js"
import {create_svg_elem} from "../utils/misc_utils.js"
import {History} from "./history.js"


// holds context info for states
class App {
    constructor({
        svg=null,
        menu_elem: menu_elem = null,
        history_elem: history_elem = null, undo_list_elem=null, redo_list_elem=null
    }={}) {
        // inits
        this.contours= []
        this.svg= svg || create_svg_elem("svg")
        this.menu_elem= menu_elem || document.createElement("div")
		this.history_elem= history_elem || document.createElement("div")

        // init state
        this.state= new IdleState(this)

        // command history
        this.history= new History(
            this.history_elem,
            {redo_list_elem:redo_list_elem, undo_list_elem:undo_list_elem}
        )

        // central contour
        this.central_contour= new Contour([], {svg:this.svg, parent:this, has_head_marker:true, is_closed:false})
        this.central_contour.appendTo(this.svg)
        this.central_contour.html_elem.classList.add("central")
    }

    addContour(points, {...kwargs}={}){
        // create contour
        let tmp= new Contour(points, {svg:this.svg, parent:this, ...kwargs})

        // add center of contour to central_contour
        // this.central_contour.manager.insertPoint(tmp.center.loc, this.contours.length)

        // insert
        this.contours.push(tmp)
        this.svg.append(tmp.html_elem)

        return this
    }

    reset(){
        this.state= new IdleState(this)
        this.state.addListeners()
    }
}


export {
    App
}