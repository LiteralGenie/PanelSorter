import {BaseMenu} from "./base_menu.js"
import {Command} from "../command.js"
import {get_rel_coords} from "../../utils/contour_utils.js"


let opt_text= {
	rem_pt: "Remove point",
}

class PointMenu extends BaseMenu {
	constructor(app, point, mouse_event){
		// super init
		super()

		// self inits
		this.app= app
		this.contour= point.parent
		this.point= point
		this.event= mouse_event

		// add options
		this._initOptions()

		// set location
		let s= this.html_elem.style
		s.left= this.event.pageX + "px"
		s.top= this.event.pageY + "px"

		// other
		this.html_elem.classList.add("point-menu")
	}

	_initOptions(){
		// option - add point
		let rem_opt= new OptRemovePt(this)
		this.createOption(rem_opt.text, rem_opt.cb)
	}
}


// Helper classes --- not real Option instances
class OptRemovePt {
	constructor(parent) {
		this.parent= parent
		this.text= opt_text.rem_pt
		let mgr= this.parent.contour.manager

		this.cb= function(e){
			// create command
			/// create redo
			let cmd= new Command({name: "Remove Point"})
			cmd.addRedo(
				mgr.removePoint.bind(mgr),
				this.parent.point
			)

			/// create undo
			cmd.addUndo(
				mgr.breakSegment.bind(mgr)
			)

			/// get undo args (store and reuse point-to-remove)
			let tmp= mgr.segment_map.get(this.parent.point)
			cmd.undoPre= () => {
				let out= cmd.redo_output

				/// get segment that wasn't removed
				let target_seg= tmp[0]
				if([target_seg.start, target_seg.end].toString() == [out['segment'].start, out['segment'].end].toString()) {
					target_seg= tmp[1]
				}

				cmd.undo_args= [out['point'].loc, target_seg]
			}
			cmd.undoPost= () => {
				cmd.undo_args.splice(0, 2)
				mgr.movePoint(cmd.undo_output, this.parent.point.loc)
			}

			/// execute
			cmd.redo()
			this.parent.app.history.redo_history.push(cmd)
		}.bind(this)
	}
}


export {
	PointMenu
}
