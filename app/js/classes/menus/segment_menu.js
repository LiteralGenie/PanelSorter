import {BaseMenu} from "./base_menu.js"
import {get_rel_coords} from "../../utils/contour_utils.js"
import {Command} from "../command.js"


let opt_text= {
	add_pt: "Add point",
	rem_seg: "Remove segment"
}

class SegmentMenu extends BaseMenu {
	constructor(app, segment, mouse_event){
		// super init
		super()

		// self inits
		this.app= app
		this.contour= segment.parent
		this.segment= segment
		this.event= mouse_event

		// add options
		this._initOptions()

		// set location
		let s= this.html_elem.style
		s.left= this.event.pageX + "px"
		s.top= this.event.pageY + "px"

		// other
		this.html_elem.classList.add("segment-menu")
	}

	_initOptions(){
		// option - add point
		let add_opt= new OptAddPoint(this)
		this.createOption(add_opt.text, add_opt.cb)

		// option - remove segment
		let rem_opt= new OptRemoveSeg(this)
		this.createOption(rem_opt.text, rem_opt.cb)

		// let undo_opt= new OptUndo(this)
		// this.createOption(undo_opt.text, undo_opt.cb)
	}
}


// Helper classes --- not real Option instances
class OptRemoveSeg {
	constructor(parent) {
		this.parent= parent
		this.text= opt_text.rem_seg
		this.cb= function(e){
			// inits
			let mgr= this.parent.contour.manager

			// create command
			let cmd= new Command({name: "Remove Segment"})
			cmd.addRedo(
				mgr.removeSegment.bind(mgr),
				this.parent.segment)
			cmd.addUndo(
				null,null, //todo
			)

			// execute
			cmd.redo()
			this.parent.app.history.redo_history.push(cmd)
		}.bind(this)
	}
}

class OptAddPoint {
	constructor(parent) {
		this.parent= parent
		this.text= opt_text.add_pt
		this.cb= function(e){
			// inits
			let mgr= this.parent.contour.manager

			// get svg coordinates of click
			let new_loc= [this.parent.event.clientX, this.parent.event.clientY]
			if(this.parent.contour.svg){
				new_loc= get_rel_coords(new_loc, this.parent.contour.svg)
			}

			// add-point command
			/// create redo
			let cmd= new Command({name: "Add Point"})
			cmd.addRedo(
				mgr.breakSegment.bind(mgr),
				new_loc, this.parent.segment
			)

			/// create undo
			cmd.addUndo(
				mgr.removePoint.bind(mgr)
			)

			/// add new point (redo output) as temporary undo argument
			cmd.undoPre= function() {
				cmd.undo_args.push(cmd.redo_output)
			}
			cmd.undoPost= function() {
				cmd.undo_args.pop()
			}

			/// execute
			cmd.redo()
			this.parent.app.history.redo_history.push(cmd)
		}.bind(this)
	}
}

class OptUndo {
	constructor(parent) {
		this.parent= parent
		this.text= "undo test"

		let hist= this.parent.app.history
		this.cb= hist.undo.bind(hist)
	}
}

export {
	SegmentMenu
}
