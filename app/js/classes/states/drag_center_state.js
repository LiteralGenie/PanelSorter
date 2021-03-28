import {BaseState} from "./base_state.js"
import {StateListener} from "./state_listener.js"
import {get_rel_coords} from "../../utils/contour_utils.js"
import {IdleState} from "./idle_state.js"


class DragCenterState extends BaseState {
    constructor(app, active_pt) {
        super(app)

        this.app= app
        this.active_pt= active_pt
        this.cursor_segment= new Segment(
            this.active_pt.loc, this.active_pt.loc,
            {svg:this.active_pt.svg, parent:null, has_head_marker:true}
            )
        this.listeners= this.listeners.concat(this.getListeners())

        this.centers= app.contours.map(c => c.center)
    }

    getListeners(){
		// unselect on mouse up
		let unselect_pt= function(e) {
		    this.transition(IdleState, this.app)
		}.bind(this)

        // arrow from last active point to mouse
        let cursor_arrow= function(e) {
		    let new_loc= get_rel_coords([e.clientX, e.clientY], this.app.svg)
            this.cursor_segment.moveTo(this.cursor_segment.start, new_loc)
        }

        // return
        return [
            new StateListener("mouseup", unselect_pt, this.app.svg),
            new StateListener("mousemove", cursor_arrow, this.app.svg),
            ...this.getCenterListeners(),
        ]
    }

    getCenterListeners() {

    }
}


export {
    DragCenterState
}