function contourRightClick(target_comp, mouse_event){
    return new CustomEvent("contourRightClick", {
        bubbles: true,
        detail: {
            target_comp,
            event: mouse_event,
            new_menu: null,
        }
    })
}

function pointClick(target_comp, mouse_event){
    return new CustomEvent("pointClick", {
        bubbles: true,
        detail: {
            target_comp,
            event: mouse_event,
        }
    })
}

function newPoint(target_comp){
    return new CustomEvent("newPoint", {
        bubbles: true,
        detail: {
            target_comp,
        }
    })
}

function newSegment(target_comp){
    return new CustomEvent("newSegment", {
        bubbles: true,
        detail: {
            target_comp,
        }
    })
}

export {contourRightClick, pointClick, newPoint, newSegment}