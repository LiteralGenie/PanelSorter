import {BaseState} from "./base_state.js"
import {StateListener} from "./state_listener.js"
import {get_rel_coords} from "../../utils/contour_utils.js"
import {IdleState} from "./idle_state.js"


class DragPointState extends BaseState {
    constructor(app, active_pt) {
        super(app)
        this.active_pt= active_pt

        this.listeners= this.listeners.concat(this.getListeners())
    }

    getListeners(){
        // move active pt
		let move_pt= function(e) {
		    let new_loc= get_rel_coords([e.clientX, e.clientY], this.app.svg)
            this.active_pt.parent.manager.movePoint(this.active_pt, new_loc)

            //todo: comand pattern
		}.bind(this)

		// unselect on mouse up
		let unselect_pt= function(e) {
		    this.transition(IdleState, this.app)
		}.bind(this)

        // return
        return [
            new StateListener("mousemove", move_pt, this.app.svg),
            new StateListener("mouseup", unselect_pt, this.app.svg),
        ]
    }
}


export {
    DragPointState
}