import {SegmentMenu} from "../menus/segment_menu.js"
import {DragPointState} from "./drag_point_state.js"
import {StateListener} from "./state_listener.js"
import {PointMenu} from "../menus/point_menu.js"
import {Segment} from "../components/segment.js"
import {BaseState} from "./base_state.js"
import {Point} from "../components/point.js"
import {DragCenterState} from "./drag_center_state.js"


/*  Default app state  */
class IdleState extends BaseState {
    constructor(app) {
        // inits
        super(app)

        // add contour-specific listeners
        app.contours.forEach(function(c) {
           this.listeners= this.listeners.concat(this.getContourListeners(c))
        }.bind(this))

        // add svg-wide listeners
        this.listeners= this.listeners.concat(this.getSvgListeners(this.app.svg))
    }

    cleanup() {
        this.clearMenus()
    }

    getSvgListeners(svg) {
        // delete menus on click
		let delete_menu= function(e) {
			this.clearMenus()
		}.bind(this)

        // add events to new points
        let addPtEvents= function(e) {
		    let lst= this.getPointListeners(e.detail.target_comp)
		    this.addListeners(lst)
        }.bind(this)

        // add events to new segments
        let addSegEvents= function(e) {
		    let lst= this.getPointListeners(e.detail.target_comp)
		    this.addListeners(lst)
        }.bind(this)

        // return
        return [
            new StateListener("mousedown", delete_menu, svg),
            new StateListener("newPoint", addPtEvents, svg),
            new StateListener("newSegment", addSegEvents, svg),
        ]
    }

    clearMenus(exclude=null) {
        let menus= Array.from(this.app.menu_elem.childNodes)
        menus.filter(m => m !== exclude).forEach(m => m.remove())
    }

    showMenu(menu) {
        this.clearMenus(menu.html_elem)
        this.app.menu_elem.append(menu.html_elem)
    }

    getContourListeners(cntr) {
        // inits
        let ret= []

        // segment listeners
        cntr.segments.forEach(function(seg) {
            ret= ret.concat(this.getSegmentListeners(seg))
        }.bind(this))

        // point listeners
        cntr.points.forEach(function(pt) {
            ret= ret.concat(this.getPointListeners(pt))
        }.bind(this))

        // center listener
        ret= ret.concat(this.getCenterListeners(cntr.center))

        // right-click menu
        let create_menu= function(e) {
            let target= e.detail.target_comp
            let src_event= e.detail.event
            let menu

            // create menu
            switch(target.constructor.name){
                case Segment.name:
                    menu= new SegmentMenu(
                        this.app,
                        e.detail.target_comp,
                        src_event,
                    )
                    break
                case Point.name:
                    menu= new PointMenu(
                        this.app,
                    	e.detail.target_comp,
                    	src_event,
                    )
                    break
            }
            if(!menu){return}

            // show menu
            this.showMenu(menu)
        }.bind(this)
        ret.push(new StateListener("contourRightClick", create_menu, cntr.html_elem))

        // return
        return ret
    }

    getSegmentListeners(seg) {
        // inits
        let showSeg= ()=> seg.enlarge=1
        let hideSeg= ()=> seg.enlarge=0

        // return
        return [
            new StateListener("mouseenter", showSeg, seg.html_elem),
            new StateListener("mouseleave", hideSeg, seg.html_elem),
        ]
    }

    getPointListeners(pt) {
        // inits
        let ret= []

        // show bigger circle on hover
        let showPt= ()=> pt.enlarge=1
        let hidePt= ()=> pt.enlarge=0

        ret.push(new StateListener("mouseenter", showPt, pt.html_elem))
        ret.push(new StateListener("mouseleave", hidePt, pt.html_elem))

        // transition to vertex drag state
        if(pt.draggable) {
            let dragPt= function(e) {
                // check if left-click
                if(e.buttons%2 !== 1) return

                // change states
                this.transition(DragPointState, this.app, pt)
            }.bind(this)

            ret.push(new StateListener("mousedown", dragPt, pt.html_elem))
        }

        // return
        return ret
    }

    getCenterListeners(pt) {
        // inits
        let ret= []

        // transition to center drag state
        if(pt.draggable) {
            let dragPt= function(e) {
                // check if left-click
                if(e.buttons%2 !== 1) return

                // change states
                this.transition(DragCenterState, this.app, pt)
            }.bind(this)

            ret.push(new StateListener("mousedown", dragPt, pt.html_elem))
        }

        // return
        return ret
    }
}


export {
    IdleState
}